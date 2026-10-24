import torch
import torch.nn as nn
import cv2
import numpy as np
from PIL import Image, ImageDraw
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from tqdm import tqdm
import os
from transformers import CLIPProcessor, CLIPModel
import torchvision.transforms as transforms
from sklearn.metrics.pairwise import cosine_similarity
import requests
from io import BytesIO

class ModernSceneLocalizer:
    def __init__(self, model_name="openai/clip-vit-base-patch32", device=None):
        """
        Initialize with modern CLIP model from Hugging Face
        Uses transformers library instead of the old clip-by-openai
        """
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {self.device}")
        
        # Load modern CLIP model from Hugging Face
        print("Loading modern CLIP model from Hugging Face...")
        self.model = CLIPModel.from_pretrained(model_name).to(self.device)
        self.processor = CLIPProcessor.from_pretrained(model_name)
        self.model.eval()
        
        print(f"✅ Modern CLIP model {model_name} loaded successfully!")
        
    def create_sliding_windows(self, image, window_sizes=[(224, 224), (320, 320), (448, 448)], 
                             overlap=0.5, max_windows=50):
        """Create sliding windows of different sizes"""
        h, w = image.shape[:2]
        windows = []
        window_info = []
        
        for win_h, win_w in window_sizes:
            # Calculate step sizes
            step_h = int(win_h * (1 - overlap))
            step_w = int(win_w * (1 - overlap))
            
            for y in range(0, h - win_h + 1, step_h):
                for x in range(0, w - win_w + 1, step_w):
                    if len(windows) >= max_windows:
                        break
                    
                    window = image[y:y+win_h, x:x+win_w]
                    windows.append(window)
                    
                    # Store window coordinates (normalized)
                    window_info.append({
                        'bbox': [x/w, y/h, (x+win_w)/w, (y+win_h)/h],
                        'size': (win_w, win_h)
                    })
                
                if len(windows) >= max_windows:
                    break
            
            if len(windows) >= max_windows:
                break
        
        return windows, window_info
    
    def create_grid_proposals(self, image, grid_sizes=[(3, 3), (4, 4), (5, 5)]):
        """Create grid-based region proposals"""
        h, w = image.shape[:2]
        proposals = []
        proposal_info = []
        
        for grid_h, grid_w in grid_sizes:
            cell_h = h // grid_h
            cell_w = w // grid_w
            
            for i in range(grid_h):
                for j in range(grid_w):
                    y1 = i * cell_h
                    x1 = j * cell_w
                    y2 = min((i + 1) * cell_h, h)
                    x2 = min((j + 1) * cell_w, w)
                    
                    proposal = image[y1:y2, x1:x2]
                    proposals.append(proposal)
                    
                    proposal_info.append({
                        'bbox': [x1/w, y1/h, x2/w, y2/h],
                        'grid_pos': (i, j),
                        'grid_size': (grid_h, grid_w)
                    })
        
        return proposals, proposal_info
    
    def preprocess_regions(self, regions, text_query):
        """Preprocess image regions and text for modern CLIP"""
        # Convert numpy arrays to PIL Images
        pil_images = []
        for region in regions:
            if isinstance(region, np.ndarray):
                region_pil = Image.fromarray(region)
            else:
                region_pil = region
            pil_images.append(region_pil)
        
        # Process images and text together
        inputs = self.processor(
            text=[text_query],
            images=pil_images,
            return_tensors="pt",
            padding=True
        )
        
        # Move to device
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        return inputs
    
    def compute_similarities(self, inputs):
        """Compute similarities using modern CLIP"""
        with torch.no_grad():
            outputs = self.model(**inputs)
            
            # Get image and text features
            image_features = outputs.image_embeds
            text_features = outputs.text_embeds
            
            # Normalize features
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
            
            # Compute similarities
            similarities = torch.matmul(image_features, text_features.T).squeeze()
            
        return similarities
    
    def localize_scene(self, image_path, query, method="sliding_window", 
                      visualize=True, top_k=3):
        """
        Localize scene based on natural language query
        """
        # Load image
        if isinstance(image_path, str):
            if image_path.startswith('http'):
                # Handle URLs
                response = requests.get(image_path)
                image = Image.open(BytesIO(response.content)).convert('RGB')
            else:
                image = Image.open(image_path).convert('RGB')
        else:
            image = image_path
        
        image_np = np.array(image)
        
        # Generate region proposals
        regions = []
        region_info = []
        
        if method in ["sliding_window", "both"]:
            sliding_regions, sliding_info = self.create_sliding_windows(image_np)
            regions.extend(sliding_regions)
            region_info.extend(sliding_info)
        
        if method in ["grid", "both"]:
            grid_regions, grid_info = self.create_grid_proposals(image_np)
            regions.extend(grid_regions)
            region_info.extend(grid_info)
        
        print(f"Generated {len(regions)} region proposals")
        
        # Process regions in batches to avoid memory issues
        batch_size = 16
        all_similarities = []
        
        for i in range(0, len(regions), batch_size):
            batch_regions = regions[i:i+batch_size]
            
            # Preprocess batch
            inputs = self.preprocess_regions(batch_regions, query)
            
            # Compute similarities
            batch_similarities = self.compute_similarities(inputs)
            
            if batch_similarities.dim() == 0:  # Single similarity score
                batch_similarities = batch_similarities.unsqueeze(0)
                
            all_similarities.append(batch_similarities)
        
        # Combine all similarities
        similarities = torch.cat(all_similarities, dim=0)
        
        # Get top-k regions
        top_indices = similarities.argsort(descending=True)[:top_k]
        top_similarities = similarities[top_indices]
        
        results = []
        for i, idx in enumerate(top_indices):
            bbox = region_info[idx]['bbox']
            similarity = top_similarities[i].item()
            
            # Convert normalized bbox to pixel coordinates
            w, h = image.size
            pixel_bbox = [
                bbox[0] * w, bbox[1] * h,
                bbox[2] * w, bbox[3] * h
            ]
            
            results.append({
                'bbox': pixel_bbox,
                'bbox_normalized': bbox,
                'similarity': similarity,
                'region_info': region_info[idx]
            })
        
        if visualize:
            self.visualize_results(image, query, results)
        
        return results
    
    def visualize_results(self, image, query, results):
        """Visualize localization results"""
        fig, axes = plt.subplots(1, len(results) + 1, figsize=(5 * (len(results) + 1), 5))
        
        if len(results) == 0:
            axes = [axes]
        elif len(results) == 1:
            axes = [axes[0], axes[1]]
        
        # Show original image
        axes[0].imshow(image)
        axes[0].set_title(f'Query: "{query}"')
        axes[0].axis('off')
        
        # Draw all bounding boxes on original image
        colors = ['red', 'blue', 'green', 'orange', 'purple']
        for i, result in enumerate(results):
            bbox = result['bbox']
            color = colors[i % len(colors)]
            rect = patches.Rectangle(
                (bbox[0], bbox[1]), bbox[2] - bbox[0], bbox[3] - bbox[1],
                linewidth=3, edgecolor=color, facecolor='none',
                alpha=0.8
            )
            axes[0].add_patch(rect)
            
            # Add similarity score
            axes[0].text(bbox[0], bbox[1] - 10, f'{result["similarity"]:.3f}',
                        color=color, fontsize=12, fontweight='bold',
                        bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
        
        # Show cropped regions
        for i, result in enumerate(results):
            if i + 1 < len(axes):
                bbox = result['bbox']
                cropped = image.crop(bbox)
                
                axes[i + 1].imshow(cropped)
                axes[i + 1].set_title(f'Top {i+1} (Score: {result["similarity"]:.3f})')
                axes[i + 1].axis('off')
        
        plt.tight_layout()
        plt.savefig('localization_results.png', dpi=150, bbox_inches='tight')
        plt.show()
        
        return fig
    
    def batch_localize(self, image_query_pairs, method="sliding_window"):
        """Process multiple image-query pairs"""
        results = []
        
        for image_path, query in tqdm(image_query_pairs, desc="Processing images"):
            try:
                result = self.localize_scene(
                    image_path, query, method=method, visualize=False
                )
                results.append({
                    'image_path': image_path,
                    'query': query,
                    'results': result
                })
            except Exception as e:
                print(f"Error processing {image_path}: {e}")
                continue
        
        return results
    
    def create_demo_video(self, test_cases, output_path='demo_video.mp4'):
        """Create demo video for submission"""
        import cv2
        
        # Video settings
        fps = 2
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        
        # Process first image to get dimensions
        first_image = Image.open(test_cases[0]['image_path'])
        w, h = first_image.size
        
        # Create video writer
        out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
        
        for case in test_cases:
            try:
                # Get localization results
                results = self.localize_scene(
                    case['image_path'], 
                    case['query'], 
                    visualize=False
                )
                
                # Load image and draw results
                image = cv2.imread(case['image_path'])
                image = cv2.resize(image, (w, h))
                
                # Draw best result
                if results:
                    bbox = results[0]['bbox']
                    x1, y1, x2, y2 = map(int, bbox)
                    
                    # Draw bounding box
                    cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 3)
                    
                    # Add query text
                    cv2.putText(image, f'Query: {case["query"]}', (10, 30),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                    
                    # Add confidence score
                    score = results[0]['similarity']
                    cv2.putText(image, f'Confidence: {score:.3f}', (10, 70),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                # Write frames (3 seconds per result)
                for _ in range(fps * 3):
                    out.write(image)
                    
            except Exception as e:
                print(f"Error processing {case['image_path']}: {e}")
                continue
        
        out.release()
        print(f"✅ Demo video created: {output_path}")

def download_sample_images():
    """Download sample images for testing"""
    sample_urls = [
        "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.tribuneindia.com%2Fnews%2Farchive%2Fjalandhar%2Fsmile-for-street-vendors-soon-211741%2F&psig=AOvVaw0N4cZItn5rzZwafUMsjbSn&ust=1755069319068000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCNim1O_chI8DFQAAAAAdAAAAABAK",  # Street scene
        # "https://images.unsplash.com/photo-1534330207526-8e81f10ec6fc?w=800",  # People walking
        # "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800",  # Market scene
    ]
    
    os.makedirs('sample_images', exist_ok=True)
    
    for i, url in enumerate(sample_urls):
        try:
            response = requests.get(url)
            with open(f'sample_images/sample_{i+1}.jpg', 'wb') as f:
                f.write(response.content)
            print(f"✅ Downloaded sample_{i+1}.jpg")
        except:
            print(f"❌ Failed to download sample_{i+1}.jpg")

def main():
    """Main function demonstrating the system"""
    print("🚀 Initializing Modern Scene Localization System...")
    
    # Initialize localizer
    localizer = ModernSceneLocalizer()
    
    # Download sample images
    print("\n📥 Downloading sample images...")
    download_sample_images()
    
    # Test cases for different scenarios
    test_cases = [
        {
            'image_path': 'sample_images/sample_1.jpg',
            'query': 'person walking'
        },
        {
            'image_path': 'sample_images/sample_2.jpg', 
            'query': 'group of people'
        },
        {
            'image_path': 'sample_images/sample_3.jpg',
            'query': 'market vendor'
        }
    ]
    
    print("\n🔍 Running scene localization tests...")
    
    # Test each case
    for i, case in enumerate(test_cases):
        if os.path.exists(case['image_path']):
            print(f"\n--- Test {i+1}: {case['query']} ---")
            
            try:
                results = localizer.localize_scene(
                    case['image_path'],
                    case['query'],
                    method="both",  # Use both sliding window and grid
                    visualize=True,
                    top_k=3
                )
                
                print(f"✅ Found {len(results)} candidate regions")
                for j, result in enumerate(results):
                    print(f"  Region {j+1}: Similarity = {result['similarity']:.3f}")
                
                # Save cropped region
                image = Image.open(case['image_path'])
                best_region = image.crop(results[0]['bbox'])
                best_region.save(f'result_{i+1}_cropped.jpg')
                print(f"💾 Saved cropped region as 'result_{i+1}_cropped.jpg'")
                
            except Exception as e:
                print(f"❌ Error: {e}")
        else:
            print(f"⚠️  Sample image not found: {case['image_path']}")
    
    # Create demo video
    print("\n🎬 Creating demo video...")
    try:
        available_cases = [case for case in test_cases 
                          if os.path.exists(case['image_path'])]
        if available_cases:
            localizer.create_demo_video(available_cases)
        else:
            print("❌ No images available for demo video")
    except Exception as e:
        print(f"❌ Video creation error: {e}")
    
    print("\n✅ Demo completed! Check the generated files:")
    print("   - localization_results.png (visualization)")
    print("   - result_*_cropped.jpg (cropped regions)")
    print("   - demo_video.mp4 (demo video)")

def quick_test_with_url(image_url, query):
    """Quick test with any image URL"""
    localizer = ModernSceneLocalizer()
    results = localizer.localize_scene(image_url, query, visualize=True)
    return results

def test_your_images():
    """Test with your own images"""
    localizer = ModernSceneLocalizer()
    
    # Add your image paths and queries here
    your_test_cases = [
        {
            'image_path': 'your_image_1.jpg',  # Replace with your image path
            'query': 'person standing'          # Replace with your query
        },
        {
            'image_path': 'your_image_2.jpg',
            'query': 'car parked'
        }
    ]
    
    for case in your_test_cases:
        if os.path.exists(case['image_path']):
            print(f"Testing: {case['query']} on {case['image_path']}")
            results = localizer.localize_scene(
                case['image_path'], 
                case['query'], 
                visualize=True
            )
        else:
            print(f"Image not found: {case['image_path']}")

if __name__ == "__main__":
    main()
    
    # Uncomment to test with your own images:
    # test_your_images()
    
    # Uncomment to test with any URL:
    # quick_test_with_url(
    #     "https://your-image-url.jpg", 
    #     "your query here"
    # )
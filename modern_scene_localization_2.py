import torch
import torchvision.transforms as transforms
from transformers import CLIPProcessor, CLIPModel
import cv2
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
import requests
from sklearn.metrics.pairwise import cosine_similarity
import os
import warnings
warnings.filterwarnings('ignore')

class ModernSceneLocalizer:
    def __init__(self, device=None):
        """Initialize the scene localization system with modern CLIP"""
        self.device = device if device else ('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"🚀 Initializing Modern Scene Localization System...")
        print(f"Using device: {self.device}")
        
        # Load modern CLIP from Hugging Face
        print("Loading pre-trained CLIP model...")
        self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        self.model.to(self.device)
        self.model.eval()
        
        print("✅ Modern CLIP model loaded successfully!")
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
        
    def extract_direct_url_from_google_redirect(self, google_url):
        """Extract the actual URL from Google Images redirect"""
        import urllib.parse as urlparse
        
        try:
            # Parse the Google redirect URL
            if "google.com/url" in google_url:
                # Extract the 'url' parameter from the Google redirect
                parsed = urlparse.urlparse(google_url)
                params = urlparse.parse_qs(parsed.query)
                
                if 'url' in params:
                    actual_url = params['url'][0]
                    print(f"🔗 Extracted actual URL: {actual_url}")
                    return actual_url
                    
            return google_url
            
        except Exception as e:
            print(f"⚠️  Could not parse Google URL: {str(e)}")
            return google_url
    
    def download_image_from_tribune_page(self, page_url):
        """Try to extract image directly from Tribune India page"""
        try:
            print(f"🌐 Attempting to access Tribune page...")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(page_url, headers=headers, timeout=30)
            if response.status_code == 200:
                # Look for image URLs in the page content
                import re
                content = response.text
                
                # Find image URLs in the page
                img_patterns = [
                    r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>',
                    r'background-image:\s*url\(["\']?([^"\')\s]+)["\']?\)',
                    r'data-src=["\']([^"\']+)["\']'
                ]
                
                for pattern in img_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    for match in matches:
                        if any(ext in match.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                            if 'tribune' in match.lower() or 'street' in match.lower() or 'vendor' in match.lower():
                                # Make absolute URL if relative
                                if match.startswith('/'):
                                    match = 'https://www.tribuneindia.com' + match
                                elif not match.startswith('http'):
                                    match = 'https://www.tribuneindia.com/' + match.lstrip('/')
                                
                                print(f"🎯 Found potential image: {match}")
                                return match
                                
        except Exception as e:
            print(f"⚠️  Could not access Tribune page: {str(e)}")
        
        return None

    def download_image(self, url, filename="test_image.jpg"):
        """Download image from URL with better error handling"""
        try:
            print(f"📥 Downloading image from: {url}")
            
            # Handle Google Images redirect URLs
            if "google.com/url" in url:
                print("🔗 Detected Google redirect URL, extracting actual URL...")
                
                # Try to extract the Tribune India page URL
                actual_url = self.extract_direct_url_from_google_redirect(url)
                print(f"🌐 Attempting to access: {actual_url}")
                
                # If it's a Tribune India page, try to extract the image
                if 'tribuneindia.com' in actual_url:
                    direct_image_url = self.download_image_from_tribune_page(actual_url)
                    if direct_image_url:
                        url = direct_image_url
                    else:
                        print("⚠️  Could not extract image from Tribune page, using alternative...")
                        # Use a Tribune India related street vendor image
                        url = "https://images.unsplash.com/photo-1606814893907-c2e42943c91f?w=800&q=80"  # Indian street vendor
                else:
                    url = actual_url
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
            
            response = requests.get(url, headers=headers, timeout=30, stream=True)
            response.raise_for_status()
            
            # Check if it's actually an image
            content_type = response.headers.get('content-type', '')
            if 'image' not in content_type.lower() and 'octet-stream' not in content_type.lower():
                print(f"⚠️  URL returned {content_type}, not an image. Using fallback...")
                raise Exception("Not an image file")
            
            with open(filename, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"✅ Image downloaded successfully as {filename}")
            return filename
            
        except Exception as e:
            print(f"❌ Error downloading image: {str(e)}")
            print("🔄 Using fallback Indian street vendor images...")
            
            # Fallback to Indian street vendor images
            fallback_urls = [
                "https://images.unsplash.com/photo-1606814893907-c2e42943c91f?w=800&q=80",  # Indian street vendor
                "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",  # Street vendor
                "https://images.unsplash.com/photo-1583258292688-d0213dc5bcec?w=800&q=80",  # Indian market
                "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",  # Street scene
                "https://picsum.photos/800/600"  # Random image as last resort
            ]
            
            for fallback_url in fallback_urls:
                try:
                    response = requests.get(fallback_url, headers=headers, timeout=10, stream=True)
                    response.raise_for_status()
                    
                    with open(filename, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            f.write(chunk)
                    
                    print(f"✅ Fallback image downloaded successfully")
                    return filename
                except:
                    continue
            
            raise Exception("Could not download any image")
    
    def preprocess_image(self, image_path):
        """Load and preprocess image"""
        try:
            image = Image.open(image_path).convert('RGB')
            return image
        except Exception as e:
            print(f"Error loading image: {str(e)}")
            return None
    
    def sliding_window_search(self, image, query_text, window_sizes=[(224, 224), (300, 300), (400, 400)], 
                            stride=50, top_k=5):
        """Advanced sliding window search with multiple scales"""
        print(f"🔍 Searching for: '{query_text}'")
        
        if image is None:
            return []
        
        # Convert PIL to numpy for OpenCV operations
        img_array = np.array(image)
        original_h, original_w = img_array.shape[:2]
        
        all_detections = []
        
        # Process text query
        text_inputs = self.processor(text=[query_text], return_tensors="pt", padding=True)
        text_inputs = {k: v.to(self.device) for k, v in text_inputs.items()}
        
        with torch.no_grad():
            text_features = self.model.get_text_features(**text_inputs)
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        
        for window_w, window_h in window_sizes:
            print(f"  🔎 Scanning with window size: {window_w}x{window_h}")
            
            # Adjust stride based on window size
            current_stride = max(stride, min(window_w, window_h) // 4)
            
            for y in range(0, max(1, original_h - window_h + 1), current_stride):
                for x in range(0, max(1, original_w - window_w + 1), current_stride):
                    # Extract window
                    x2, y2 = min(x + window_w, original_w), min(y + window_h, original_h)
                    
                    if x2 - x < window_w // 2 or y2 - y < window_h // 2:
                        continue
                    
                    window_img = image.crop((x, y, x2, y2))
                    
                    # Process image patch
                    image_inputs = self.processor(images=window_img, return_tensors="pt", padding=True)
                    image_inputs = {k: v.to(self.device) for k, v in image_inputs.items()}
                    
                    with torch.no_grad():
                        image_features = self.model.get_image_features(**image_inputs)
                        image_features = image_features / image_features.norm(dim=-1, keepdim=True)
                        
                        # Calculate similarity
                        similarity = torch.cosine_similarity(text_features, image_features, dim=-1)
                        score = similarity.item()
                    
                    all_detections.append({
                        'bbox': (x, y, x2, y2),
                        'score': score,
                        'window_size': (window_w, window_h)
                    })
        
        # Sort by score and apply non-maximum suppression
        all_detections.sort(key=lambda x: x['score'], reverse=True)
        
        # Simple NMS
        final_detections = []
        for detection in all_detections[:top_k * 3]:  # Consider more candidates
            bbox = detection['bbox']
            is_suppressed = False
            
            for final_det in final_detections:
                if self.calculate_iou(bbox, final_det['bbox']) > 0.3:
                    is_suppressed = True
                    break
            
            if not is_suppressed:
                final_detections.append(detection)
                if len(final_detections) >= top_k:
                    break
        
        return final_detections[:top_k]
    
    def calculate_iou(self, box1, box2):
        """Calculate Intersection over Union (IoU)"""
        x1, y1, x2, y2 = box1
        x1_2, y1_2, x2_2, y2_2 = box2
        
        # Calculate intersection
        xi1, yi1 = max(x1, x1_2), max(y1, y1_2)
        xi2, yi2 = min(x2, x2_2), min(y2, y2_2)
        
        if xi2 <= xi1 or yi2 <= yi1:
            return 0.0
        
        intersection = (xi2 - xi1) * (yi2 - yi1)
        
        # Calculate union
        area1 = (x2 - x1) * (y2 - y1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0
    
    def visualize_results(self, image_path, detections, query_text, save_path="results.jpg"):
        """Visualize detection results"""
        image = cv2.imread(image_path)
        if image is None:
            print("❌ Could not load image for visualization")
            return
        
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Create figure
        fig, axes = plt.subplots(1, min(len(detections) + 1, 4), figsize=(20, 5))
        if len(detections) == 0:
            axes = [axes]
        elif not isinstance(axes, np.ndarray):
            axes = [axes]
        
        # Original image with all detections
        ax = axes[0] if len(axes) > 1 else axes[0]
        ax.imshow(image_rgb)
        ax.set_title(f'Query: "{query_text}"', fontsize=12, fontweight='bold')
        ax.axis('off')
        
        # Draw bounding boxes
        for i, det in enumerate(detections):
            bbox = det['bbox']
            score = det['score']
            
            # Different colors for different detections
            colors = ['red', 'blue', 'green', 'yellow', 'purple']
            color = colors[i % len(colors)]
            
            # Draw rectangle
            rect = plt.Rectangle((bbox[0], bbox[1]), bbox[2] - bbox[0], bbox[3] - bbox[1],
                               fill=False, edgecolor=color, linewidth=3)
            ax.add_patch(rect)
            
            # Add score text
            ax.text(bbox[0], bbox[1] - 10, f'#{i+1}: {score:.3f}', 
                   bbox=dict(boxstyle="round,pad=0.3", facecolor=color, alpha=0.7),
                   fontsize=10, color='white', fontweight='bold')
        
        # Show individual detections
        for i, det in enumerate(detections[:min(3, len(axes) - 1)]):
            if i + 1 < len(axes):
                bbox = det['bbox']
                cropped = image_rgb[bbox[1]:bbox[3], bbox[0]:bbox[2]]
                
                ax = axes[i + 1]
                ax.imshow(cropped)
                ax.set_title(f'Detection #{i+1}\nScore: {det["score"]:.3f}', 
                           fontsize=10, fontweight='bold')
                ax.axis('off')
        
        plt.tight_layout()
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.show()
        
        print(f"✅ Results saved to {save_path}")
        
        # Save individual cropped regions
        os.makedirs("cropped_regions", exist_ok=True)
        for i, det in enumerate(detections):
            bbox = det['bbox']
            cropped = image_rgb[bbox[1]:bbox[3], bbox[0]:bbox[2]]
            
            crop_path = f"cropped_regions/detection_{i+1}_score_{det['score']:.3f}.jpg"
            plt.imsave(crop_path, cropped)
        
        print(f"✅ {len(detections)} cropped regions saved to 'cropped_regions/' folder")
    
    def localize_scene(self, image_path, query_text):
        """Main function to localize scene based on text query"""
        print(f"\n🎯 Starting scene localization...")
        print(f"📝 Query: '{query_text}'")
        print(f"🖼️  Image: {image_path}")
        
        # Load and preprocess image
        image = self.preprocess_image(image_path)
        if image is None:
            return []
        
        # Perform detection
        detections = self.sliding_window_search(image, query_text)
        
        if len(detections) == 0:
            print("❌ No relevant regions found")
            return []
        
        print(f"✅ Found {len(detections)} relevant regions!")
        
        # Print results
        for i, det in enumerate(detections):
            bbox = det['bbox']
            print(f"  🎯 Detection #{i+1}: Score={det['score']:.3f}, "
                  f"BBox=({bbox[0]}, {bbox[1]}, {bbox[2]}, {bbox[3]})")
        
        # Visualize results
        self.visualize_results(image_path, detections, query_text)
        
        return detections

def main():
    """Main execution function"""
    print("🚀 Modern Scene Localization System")
    print("=" * 50)
    
    # Initialize the system
    localizer = ModernSceneLocalizer()
    
    # Your image URL (using a working street vendor image)
    image_url = "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80"
    
    # Download the image
    try:
        image_path = localizer.download_image(image_url, "street_vendor_scene.jpg")
    except Exception as e:
        print(f"❌ Failed to download image: {str(e)}")
        return
    
    # Test queries related to street vendors and similar scenes
    test_queries = [
        "vendor selling vegetables",
        "person with food items", 
        "street seller",
        "man selling goods",
        "vegetable vendor",
        "person behind counter"
    ]
    
    print(f"\n📋 Testing {len(test_queries)} different queries...")
    
    # Test each query
    for i, query in enumerate(test_queries, 1):
        print(f"\n{'='*60}")
        print(f"🔍 Test {i}/{len(test_queries)}: '{query}'")
        print('='*60)
        
        try:
            detections = localizer.localize_scene(image_path, query)
            
            if detections:
                print(f"✅ Success! Found {len(detections)} regions for '{query}'")
            else:
                print(f"❌ No regions found for '{query}'")
                
        except Exception as e:
            print(f"❌ Error processing '{query}': {str(e)}")
    
    print(f"\n🎉 Scene localization complete!")
    print(f"📁 Check the following files:")
    print(f"  - results.jpg (visualization)")
    print(f"  - cropped_regions/ folder (individual detections)")
    print(f"  - street_vendor_scene.jpg (downloaded image)")

if __name__ == "__main__":
    main()
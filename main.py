# Complete Grounding DINO Fine-tuning Pipeline for Custom Dataset
# Scene Localization in Dense Images via Natural Language Queries
# 
# This notebook provides a complete pipeline for:
# 1. Setting up Grounding DINO environment
# 2. Creating and annotating custom datasets
# 3. Fine-tuning the model
# 4. Running inference on new images

import os
import sys
import json
import cv2
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
import torch
import torchvision
from PIL import Image
import zipfile
import shutil
from datetime import datetime
import urllib.request
import hashlib
from pathlib import Path
import subprocess
from typing import List, Dict, Tuple, Any
import warnings
warnings.filterwarnings('ignore')

# =============================================================================
# CONFIGURATION SECTION - MODIFY THESE PATHS AS NEEDED
# =============================================================================

# Main directories
BASE_DIR = "/content"
PROJECT_DIR = f"{BASE_DIR}/grounding_dino_project"
DATASET_DIR = f"{PROJECT_DIR}/custom_dataset"
IMAGES_DIR = f"{DATASET_DIR}/images"
ANNOTATIONS_DIR = f"{DATASET_DIR}/annotations"
MODELS_DIR = f"{PROJECT_DIR}/models"
WEIGHTS_DIR = f"{PROJECT_DIR}/weights"

# Google Drive mount point (for saving models)
GDRIVE_DIR = "/content/drive/MyDrive/GroundingDINO_Models"

# Training parameters
EPOCHS = 10
LEARNING_RATE = 1e-5
BATCH_SIZE = 2
TRAIN_VAL_SPLIT = 0.8

# Model configuration
MODEL_CONFIG_URL = "https://github.com/IDEA-Research/GroundingDINO/releases/download/v0.1.0-alpha2/groundingdino_swinb_cogcoor.py"
MODEL_WEIGHTS_URL = "https://github.com/IDEA-Research/GroundingDINO/releases/download/v0.1.0-alpha2/groundingdino_swinb_cogcoor.pth"

print("Configuration loaded successfully!")
print(f"Project Directory: {PROJECT_DIR}")
print(f"Dataset Directory: {DATASET_DIR}")

# =============================================================================
# CELL 1: ENVIRONMENT SETUP AND INSTALLATION
# =============================================================================

def setup_environment():
    """Setup the complete environment for Grounding DINO"""
    print("🚀 Starting environment setup...")
    
    # Create directory structure
    os.makedirs(PROJECT_DIR, exist_ok=True)
    os.makedirs(DATASET_DIR, exist_ok=True)
    os.makedirs(IMAGES_DIR, exist_ok=True)
    os.makedirs(ANNOTATIONS_DIR, exist_ok=True)
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(WEIGHTS_DIR, exist_ok=True)
    
    # Mount Google Drive
    try:
        from google.colab import drive
        drive.mount('/content/drive')
        os.makedirs(GDRIVE_DIR, exist_ok=True)
        print("✅ Google Drive mounted successfully")
    except Exception as e:
        print(f"⚠ Could not mount Google Drive: {e}")
    
    # Install dependencies with pinned versions
    print("📦 Installing dependencies...")
    dependencies = [
        "torch==2.0.1",
        "torchvision==0.15.2",
        "transformers==4.30.2",
        "timm==0.9.2",
        "supervision==0.12.0",
        "segment-anything @ git+https://github.com/facebookresearch/segment-anything.git",
        "pycocotools==2.0.6",
        "opencv-python==4.8.0.74",
        "matplotlib==3.7.1",
        "Pillow==9.5.0",
        "numpy==1.24.3",
        "scipy==1.10.1",
        "addict==2.4.0",
        "yapf==0.40.1",
        "fairscale==0.4.13"
    ]
    
    for dep in dependencies:
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", dep], 
                         check=True, capture_output=True)
            print(f"✅ Installed: {dep}")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {dep}: {e}")
    
    # Clone Grounding DINO repository
    print("📥 Cloning Grounding DINO repository...")
    if os.path.exists(f"{PROJECT_DIR}/GroundingDINO"):
        shutil.rmtree(f"{PROJECT_DIR}/GroundingDINO")
    
    os.chdir(PROJECT_DIR)
    subprocess.run(["git", "clone", "https://github.com/IDEA-Research/GroundingDINO.git"], 
                   check=True)
    
    # Install Grounding DINO in editable mode
    os.chdir(f"{PROJECT_DIR}/GroundingDINO")
    subprocess.run([sys.executable, "-m", "pip", "install", "-e", "."], check=True)
    print("✅ Grounding DINO installed in editable mode")
    
    # Add to Python path
    sys.path.append(f"{PROJECT_DIR}/GroundingDINO")
    
    print("✅ Environment setup completed!")

def download_model_files():
    """Download and verify model config and weights"""
    print("📥 Downloading model files...")
    
    # Download config file
    config_path = f"{MODELS_DIR}/groundingdino_swinb_cogcoor.py"
    if not os.path.exists(config_path):
        urllib.request.urlretrieve(MODEL_CONFIG_URL, config_path)
        print("✅ Downloaded model config")
    else:
        print("✅ Model config already exists")
    
    # Download weights file
    weights_path = f"{WEIGHTS_DIR}/groundingdino_swinb_cogcoor.pth"
    if not os.path.exists(weights_path):
        print("Downloading model weights (this may take a few minutes)...")
        urllib.request.urlretrieve(MODEL_WEIGHTS_URL, weights_path)
        print("✅ Downloaded model weights")
    else:
        print("✅ Model weights already exist")
    
    # Verify file integrity
    def verify_file_size(filepath, min_size_mb=100):
        if os.path.exists(filepath):
            size_mb = os.path.getsize(filepath) / (1024 * 1024)
            if size_mb > min_size_mb:
                print(f"✅ {os.path.basename(filepath)}: {size_mb:.1f} MB")
                return True
        print(f"❌ {os.path.basename(filepath)}: File verification failed")
        return False
    
    verify_file_size(weights_path, 600)  # Weights should be ~600MB
    verify_file_size(config_path, 0.01)  # Config should be small
    
    return config_path, weights_path

# Run setup
setup_environment()
config_path, weights_path = download_model_files()

# =============================================================================
# CELL 2: DATASET CREATION AND UPLOAD
# =============================================================================

def upload_images():
    """Upload images to Colab for annotation"""
    from google.colab import files
    
    print("📤 Please upload your images...")
    uploaded = files.upload()
    
    image_paths = []
    for filename, data in uploaded.items():
        # Save to images directory
        image_path = f"{IMAGES_DIR}/{filename}"
        with open(image_path, 'wb') as f:
            f.write(data)
        image_paths.append(image_path)
        print(f"✅ Saved: {filename}")
    
    print(f"📊 Total images uploaded: {len(image_paths)}")
    return image_paths

def create_coco_dataset():
    """Initialize COCO dataset structure"""
    coco_data = {
        "info": {
            "year": 2024,
            "version": "1.0",
            "description": "Custom Scene Localization Dataset",
            "contributor": "User",
            "date_created": datetime.now().isoformat()
        },
        "licenses": [{"id": 1, "name": "Custom", "url": ""}],
        "images": [],
        "annotations": [],
        "categories": []
    }
    return coco_data

# Initialize dataset
coco_dataset = create_coco_dataset()
image_id_counter = 1
annotation_id_counter = 1
category_id_counter = 1
categories_map = {}

print("🗂 Dataset structure initialized")
print("Ready to upload images...")

# =============================================================================
# CELL 3: INTERACTIVE ANNOTATION TOOL
# =============================================================================

class InteractiveAnnotator:
    def _init_(self, image_path):
        self.image_path = image_path
        self.image = cv2.imread(image_path)
        self.image_rgb = cv2.cvtColor(self.image, cv2.COLOR_BGR2RGB)
        self.annotations = []
        self.current_bbox = None
        self.start_point = None
        self.drawing = False
        
    def annotate_image(self):
        """Interactive annotation with matplotlib"""
        fig, ax = plt.subplots(1, 1, figsize=(12, 8))
        ax.imshow(self.image_rgb)
        ax.set_title(f"Annotating: {os.path.basename(self.image_path)}\n"
                    "Click and drag to create bounding boxes")
        
        self.fig = fig
        self.ax = ax
        self.rectangles = []
        
        # Connect mouse events
        fig.canvas.mpl_connect('button_press_event', self.on_press)
        fig.canvas.mpl_connect('button_release_event', self.on_release)
        fig.canvas.mpl_connect('motion_notify_event', self.on_motion)
        
        plt.show()
        
        return self.annotations
    
    def on_press(self, event):
        if event.inaxes != self.ax:
            return
        self.start_point = (event.xdata, event.ydata)
        self.drawing = True
    
    def on_motion(self, event):
        if not self.drawing or event.inaxes != self.ax:
            return
        
        # Remove previous temporary rectangle
        if self.current_bbox:
            self.current_bbox.remove()
        
        # Draw current rectangle
        x1, y1 = self.start_point
        x2, y2 = event.xdata, event.ydata
        
        width = abs(x2 - x1)
        height = abs(y2 - y1)
        x = min(x1, x2)
        y = min(y1, y2)
        
        self.current_bbox = Rectangle((x, y), width, height, 
                                    linewidth=2, edgecolor='red', 
                                    facecolor='none')
        self.ax.add_patch(self.current_bbox)
        self.fig.canvas.draw_idle()
    
    def on_release(self, event):
        if not self.drawing or event.inaxes != self.ax:
            return
        
        self.drawing = False
        
        if self.start_point:
            x1, y1 = self.start_point
            x2, y2 = event.xdata, event.ydata
            
            # Ensure valid bounding box
            x_min = max(0, min(x1, x2))
            y_min = max(0, min(y1, y2))
            x_max = min(self.image_rgb.shape[1], max(x1, x2))
            y_max = min(self.image_rgb.shape[0], max(y1, y2))
            
            if abs(x_max - x_min) > 10 and abs(y_max - y_min) > 10:  # Minimum size
                # Get label from user
                label = input(f"Enter label for bounding box ({x_min:.0f}, {y_min:.0f}, {x_max:.0f}, {y_max:.0f}): ")
                
                if label.strip():
                    bbox = [x_min, y_min, x_max - x_min, y_max - y_min]  # COCO format
                    self.annotations.append({
                        'bbox': bbox,
                        'label': label.strip()
                    })
                    
                    # Add permanent rectangle
                    rect = Rectangle((x_min, y_min), x_max - x_min, y_max - y_min,
                                   linewidth=2, edgecolor='green', facecolor='none')
                    self.ax.add_patch(rect)
                    self.rectangles.append(rect)
                    
                    # Add label text
                    self.ax.text(x_min, y_min - 5, label, fontsize=10, 
                               color='green', weight='bold')
                    
                    print(f"✅ Added annotation: {label} - {bbox}")
                else:
                    print("❌ Empty label, annotation skipped")
            
            # Remove temporary rectangle
            if self.current_bbox:
                self.current_bbox.remove()
                self.current_bbox = None
        
        self.fig.canvas.draw_idle()

def annotate_uploaded_images(image_paths):
    """Annotate all uploaded images"""
    global coco_dataset, image_id_counter, annotation_id_counter
    global category_id_counter, categories_map
    
    for image_path in image_paths:
        print(f"\n🎯 Annotating: {os.path.basename(image_path)}")
        
        # Load image info
        img = Image.open(image_path)
        width, height = img.size
        
        # Add image to COCO dataset
        image_info = {
            "id": image_id_counter,
            "width": width,
            "height": height,
            "file_name": os.path.basename(image_path),
            "date_captured": datetime.now().isoformat()
        }
        coco_dataset["images"].append(image_info)
        
        # Interactive annotation
        annotator = InteractiveAnnotator(image_path)
        annotations = annotator.annotate_image()
        
        # Process annotations
        for ann in annotations:
            label = ann['label']
            
            # Add category if new
            if label not in categories_map:
                categories_map[label] = category_id_counter
                coco_dataset["categories"].append({
                    "id": category_id_counter,
                    "name": label,
                    "supercategory": "object"
                })
                category_id_counter += 1
            
            # Add annotation to COCO dataset
            bbox = ann['bbox']
            area = bbox[2] * bbox[3]
            
            annotation = {
                "id": annotation_id_counter,
                "image_id": image_id_counter,
                "category_id": categories_map[label],
                "bbox": bbox,
                "area": area,
                "iscrowd": 0,
                "segmentation": []
            }
            coco_dataset["annotations"].append(annotation)
            annotation_id_counter += 1
        
        image_id_counter += 1
    
    # Save annotations
    train_file = f"{ANNOTATIONS_DIR}/train.json"
    val_file = f"{ANNOTATIONS_DIR}/val.json"
    
    # Simple train/val split
    total_images = len(coco_dataset["images"])
    train_count = int(total_images * TRAIN_VAL_SPLIT)
    
    # Create train dataset
    train_images = coco_dataset["images"][:train_count]
    train_image_ids = {img["id"] for img in train_images}
    train_annotations = [ann for ann in coco_dataset["annotations"] 
                        if ann["image_id"] in train_image_ids]
    
    train_dataset = coco_dataset.copy()
    train_dataset["images"] = train_images
    train_dataset["annotations"] = train_annotations
    
    # Create val dataset
    val_images = coco_dataset["images"][train_count:]
    val_image_ids = {img["id"] for img in val_images}
    val_annotations = [ann for ann in coco_dataset["annotations"] 
                      if ann["image_id"] in val_image_ids]
    
    val_dataset = coco_dataset.copy()
    val_dataset["images"] = val_images
    val_dataset["annotations"] = val_annotations
    
    # Save datasets
    with open(train_file, 'w') as f:
        json.dump(train_dataset, f, indent=2)
    
    with open(val_file, 'w') as f:
        json.dump(val_dataset, f, indent=2)
    
    print(f"\n📊 Dataset Statistics:")
    print(f"Total images: {total_images}")
    print(f"Training images: {len(train_images)}")
    print(f"Validation images: {len(val_images)}")
    print(f"Total annotations: {len(coco_dataset['annotations'])}")
    print(f"Categories: {list(categories_map.keys())}")
    print(f"✅ Annotations saved to: {ANNOTATIONS_DIR}")

print("🎨 Interactive Annotation Tool Ready!")
print("Run the next cell to upload and annotate your images.")

# =============================================================================
# CELL 4: FINE-TUNING SCRIPT
# =============================================================================

def create_training_config():
    """Create training configuration file"""
    config_content = f'''
# Training configuration for custom dataset
base = '{config_path}'

# Dataset settings
dataset_type = 'CocoDataset'
data_root = '{DATASET_DIR}/'

train_pipeline = [
    dict(type='LoadImageFromFile'),
    dict(type='LoadAnnotations', with_bbox=True),
    dict(type='RandomFlip', flip_ratio=0.5),
    dict(type='Normalize', **img_norm_cfg),
    dict(type='Pad', size_divisor=32),
    dict(type='DefaultFormatBundle'),
    dict(type='Collect', keys=['img', 'gt_bboxes', 'gt_labels']),
]

test_pipeline = [
    dict(type='LoadImageFromFile'),
    dict(
        type='MultiScaleFlipAug',
        img_scale=(1333, 800),
        flip=False,
        transforms=[
            dict(type='Resize', keep_ratio=True),
            dict(type='RandomFlip'),
            dict(type='Normalize', **img_norm_cfg),
            dict(type='Pad', size_divisor=32),
            dict(type='DefaultFormatBundle'),
            dict(type='Collect', keys=['img']),
        ])
]

data = dict(
    samples_per_gpu={BATCH_SIZE},
    workers_per_gpu=2,
    train=dict(
        type=dataset_type,
        ann_file='{ANNOTATIONS_DIR}/train.json',
        img_prefix='{IMAGES_DIR}/',
        pipeline=train_pipeline
    ),
    val=dict(
        type=dataset_type,
        ann_file='{ANNOTATIONS_DIR}/val.json',
        img_prefix='{IMAGES_DIR}/',
        pipeline=test_pipeline
    ),
    test=dict(
        type=dataset_type,
        ann_file='{ANNOTATIONS_DIR}/val.json',
        img_prefix='{IMAGES_DIR}/',
        pipeline=test_pipeline
    )
)

# Optimizer
optimizer = dict(
    type='AdamW',
    lr={LEARNING_RATE},
    weight_decay=0.0001,
    paramwise_cfg=dict(
        custom_keys={{
            'absolute_pos_embed': dict(decay_mult=0.),
            'relative_position_bias_table': dict(decay_mult=0.),
            'norm': dict(decay_mult=0.)
        }}
    )
)

optimizer_config = dict(grad_clip=dict(max_norm=0.1, norm_type=2))

# Learning rate schedule
lr_config = dict(
    policy='step',
    warmup='linear',
    warmup_iters=1000,
    warmup_ratio=0.001,
    step=[{int(EPOCHS*0.7)}, {int(EPOCHS*0.9)}]
)

runner = dict(type='EpochBasedRunner', max_epochs={EPOCHS})

# Checkpoint and logging
checkpoint_config = dict(interval=5)
log_config = dict(
    interval=50,
    hooks=[
        dict(type='TextLoggerHook'),
        dict(type='TensorboardLoggerHook')
    ]
)

# Runtime settings
load_from = '{weights_path}'
work_dir = '{PROJECT_DIR}/work_dirs/custom_training'
'''
    
    config_file = f"{PROJECT_DIR}/custom_config.py"
    with open(config_file, 'w') as f:
        f.write(config_content)
    
    return config_file

def fine_tune_model():
    """Fine-tune Grounding DINO on custom dataset"""
    print("🎯 Starting fine-tuning process...")
    
    # Create training configuration
    config_file = create_training_config()
    print(f"✅ Training config created: {config_file}")
    
    # Create work directory
    work_dir = f"{PROJECT_DIR}/work_dirs/custom_training"
    os.makedirs(work_dir, exist_ok=True)
    
    # Change to Grounding DINO directory
    os.chdir(f"{PROJECT_DIR}/GroundingDINO")
    
    # Training command
    train_cmd = [
        sys.executable, "-m", "torch.distributed.launch",
        "--nproc_per_node=1",
        "tools/train.py",
        config_file,
        "--work-dir", work_dir,
        "--launcher", "pytorch"
    ]
    
    print(f"🚀 Training command: {' '.join(train_cmd)}")
    
    try:
        # Run training
        result = subprocess.run(train_cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Training completed successfully!")
            
            # Find the latest checkpoint
            checkpoints = [f for f in os.listdir(work_dir) if f.endswith('.pth')]
            if checkpoints:
                latest_checkpoint = max(checkpoints, key=lambda x: os.path.getmtime(os.path.join(work_dir, x)))
                checkpoint_path = os.path.join(work_dir, latest_checkpoint)
                
                # Copy to Google Drive if mounted
                if os.path.exists('/content/drive'):
                    gdrive_checkpoint = f"{GDRIVE_DIR}/fine_tuned_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pth"
                    shutil.copy2(checkpoint_path, gdrive_checkpoint)
                    print(f"✅ Model saved to Google Drive: {gdrive_checkpoint}")
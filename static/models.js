async loadRealisticHumanModel() {
    const loader = new THREE.GLTFLoader();
    
    // Use Ready Player Me or your own GLB model
    const modelURL = 'https://models.readyplayer.me/YOUR_AVATAR_ID.glb';
    // Or use a free realistic human model
    // const modelURL = '/static/models/realistic_human.glb';
    
    try {
        this.updateStatus('Loading realistic human model...');
        
        const gltf = await new Promise((resolve, reject) => {
            loader.load(modelURL, resolve, undefined, reject);
        });
        
        // Remove existing model
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
        }
        
        this.currentModel = gltf.scene;
        this.scene.add(this.currentModel);
        
        // Scale and position the model
        this.currentModel.scale.set(1.5, 1.5, 1.5);
        this.currentModel.position.set(0, -1, 0);
        
        // Setup animations if available
        if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.currentModel);
            this.clips = gltf.animations;
            
            // Find and play idle animation
            const idleClip = gltf.animations.find(clip => 
                clip.name.toLowerCase().includes('idle')
            );
            if (idleClip) {
                this.mixer.clipAction(idleClip).play();
            }
        }
        
        // Setup facial bones for lip sync and blinking
        this.setupFacialBones();
        
        this.updateStatus('Realistic model loaded!');
        return this.currentModel;
        
    } catch (error) {
        console.error('Error loading model:', error);
        this.updateStatus('Using fallback model');
        // Fall back to geometric model
        return this.createUltraRealisticHumanModel();
    }
}

setupFacialBones() {
    // Find facial bones in the model
    this.facialBones = {};
    
    this.currentModel.traverse((child) => {
        if (child.isBone || child.isSkinnedMesh) {
            const name = child.name.toLowerCase();
            
            // Map common bone names
            if (name.includes('jaw') || name.includes('mouth')) {
                this.facialBones.jaw = child;
            }
            if (name.includes('eye') && name.includes('left')) {
                this.facialBones.leftEye = child;
            }
            if (name.includes('eye') && name.includes('right')) {
                this.facialBones.rightEye = child;
            }
            if (name.includes('head')) {
                this.facialBones.head = child;
            }
        }
    });
    
    console.log('Facial bones found:', Object.keys(this.facialBones));
}

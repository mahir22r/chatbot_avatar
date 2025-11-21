class AvatarController {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error("Canvas element not found!");
            return;
        }

        try {
            this.engine = new BABYLON.Engine(this.canvas, true, {
                preserveDrawingBuffer: true,
                stencil: true
            });
            this.scene = null;
            this.avatar = null;
            this.talkInterval = null;
            
            this.init();
        } catch (error) {
            console.error("Error initializing Babylon.js:", error);
        }
    }

    async init() {
        try {
            // Create scene
            this.scene = new BABYLON.Scene(this.engine);
            this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.2, 1.0);

            // Create camera - positioned to see the avatar properly
            this.camera = new BABYLON.ArcRotateCamera(
                "camera", 
                -Math.PI / 2, 
                Math.PI / 2.2, 
                5, 
                new BABYLON.Vector3(0, 1.5, 0), 
                this.scene
            );
            this.camera.attachControls(this.canvas, true);
            this.camera.lowerRadiusLimit = 3;
            this.camera.upperRadiusLimit = 8;
            this.camera.wheelPrecision = 50;

            // Create lighting
            const light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.scene);
            light1.intensity = 0.8;
            
            const light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(-0.5, -1, -0.5), this.scene);
            light2.intensity = 0.5;
            light2.position = new BABYLON.Vector3(5, 10, 5);

            // Create environment
            this.createEnvironment();
            
            // Create avatar
            this.createDetailedAvatar();
            this.setupAnimations();
            
            // Start render loop
            this.engine.runRenderLoop(() => {
                this.scene.render();
            });

            // Handle window resize
            window.addEventListener('resize', () => {
                this.engine.resize();
            });

            console.log("3D Avatar initialized successfully!");

        } catch (error) {
            console.error("Error in avatar initialization:", error);
            this.createSimpleAvatar();
        }
    }

    createEnvironment() {
        // Create ground
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, this.scene);
        const gridMaterial = new BABYLON.GridMaterial("gridMat", this.scene);
        gridMaterial.majorUnitFrequency = 5;
        gridMaterial.minorUnitVisibility = 0.3;
        gridMaterial.gridRatio = 1;
        gridMaterial.mainColor = new BABYLON.Color3(0.2, 0.2, 0.3);
        gridMaterial.lineColor = new BABYLON.Color3(0.4, 0.4, 0.5);
        gridMaterial.opacity = 0.2;
        ground.material = gridMaterial;

        // Add some ambient background color
        this.scene.clearColor = new BABYLON.Color4(0.2, 0.2, 0.3, 1.0);
    }

    createDetailedAvatar() {
        // Head
        const head = BABYLON.MeshBuilder.CreateSphere("head", { diameter: 0.8, segments: 16 }, this.scene);
        head.position.y = 1.7;
        
        const headMat = new BABYLON.StandardMaterial("headMat", this.scene);
        headMat.diffuseColor = new BABYLON.Color3(0.96, 0.84, 0.68);
        headMat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        head.material = headMat;

        // Body (torso)
        const body = BABYLON.MeshBuilder.CreateCylinder("body", { 
            height: 1.2, 
            diameter: 0.7, 
            tessellation: 16 
        }, this.scene);
        body.position.y = 0.8;
        
        const bodyMat = new BABYLON.StandardMaterial("bodyMat", this.scene);
        bodyMat.diffuseColor = new BABYLON.Color3(0.1, 0.3, 0.6);
        body.material = bodyMat;

        // Eyes
        const leftEye = BABYLON.MeshBuilder.CreateSphere("leftEye", { diameter: 0.08 }, this.scene);
        leftEye.position = new BABYLON.Vector3(-0.15, 1.72, 0.38);
        leftEye.material = new BABYLON.StandardMaterial("eyeMat", this.scene);
        leftEye.material.diffuseColor = new BABYLON.Color3(0, 0, 0);

        const rightEye = BABYLON.MeshBuilder.CreateSphere("rightEye", { diameter: 0.08 }, this.scene);
        rightEye.position = new BABYLON.Vector3(0.15, 1.72, 0.38);
        rightEye.material = new BABYLON.StandardMaterial("eyeMat2", this.scene);
        rightEye.material.diffuseColor = new BABYLON.Color3(0, 0, 0);

        // Mouth
        this.mouth = BABYLON.MeshBuilder.CreateSphere("mouth", { 
            diameter: 0.25, 
            segments: 8 
        }, this.scene);
        this.mouth.position = new BABYLON.Vector3(0, 1.55, 0.4);
        this.mouth.scaling = new BABYLON.Vector3(1.2, 0.15, 0.4);
        const mouthMat = new BABYLON.StandardMaterial("mouthMat", this.scene);
        mouthMat.diffuseColor = new BABYLON.Color3(0.7, 0.2, 0.2);
        this.mouth.material = mouthMat;

        // Hair (simple cap-like hair)
        const hair = BABYLON.MeshBuilder.CreateSphere("hair", { 
            diameter: 0.85, 
            segments: 8 
        }, this.scene);
        hair.position.y = 1.85;
        hair.scaling.y = 0.6;
        const hairMat = new BABYLON.StandardMaterial("hairMat", this.scene);
        hairMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        hair.material = hairMat;

        // Arms
        const leftArm = BABYLON.MeshBuilder.CreateCylinder("leftArm", { 
            height: 0.8, 
            diameter: 0.15 
        }, this.scene);
        leftArm.position = new BABYLON.Vector3(-0.5, 1.2, 0);
        leftArm.rotation.z = Math.PI / 4;
        
        const rightArm = BABYLON.MeshBuilder.CreateCylinder("rightArm", { 
            height: 0.8, 
            diameter: 0.15 
        }, this.scene);
        rightArm.position = new BABYLON.Vector3(0.5, 1.2, 0);
        rightArm.rotation.z = -Math.PI / 4;

        // Group all parts
        this.avatar = new BABYLON.TransformNode("avatar", this.scene);
        head.parent = this.avatar;
        body.parent = this.avatar;
        leftEye.parent = this.avatar;
        rightEye.parent = this.avatar;
        this.mouth.parent = this.avatar;
        hair.parent = this.avatar;
        leftArm.parent = this.avatar;
        rightArm.parent = this.avatar;

        // Store references for animation
        this.avatarParts = { 
            head, body, leftEye, rightEye, mouth: this.mouth, 
            leftArm, rightArm, hair 
        };

        // Set all parts to use body material initially
        [leftArm, rightArm].forEach(arm => {
            arm.material = bodyMat;
        });
    }

    createSimpleAvatar() {
        // Fallback simple avatar
        const sphere = BABYLON.MeshBuilder.CreateSphere("simpleAvatar", { 
            diameter: 1.5, 
            segments: 32 
        }, this.scene);
        sphere.position.y = 1.5;
        
        const material = new BABYLON.StandardMaterial("simpleMat", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.4, 0.6, 1.0);
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        sphere.material = material;
        
        this.avatar = sphere;
        this.avatarParts = { main: sphere };
    }

    setupAnimations() {
        // Idle animation - subtle breathing and slight movement
        let time = 0;
        this.scene.registerBeforeRender(() => {
            time += 0.02;
            
            if (this.avatarParts && this.avatarParts.body) {
                // Subtle breathing effect
                const breath = Math.sin(time) * 0.01;
                this.avatarParts.body.scaling.y = 1 + breath;
                
                // Very slight sway
                this.avatar.rotation.y = Math.sin(time * 0.3) * 0.05;
            }
        });
    }

    startTalking() {
        if (this.talkInterval) {
            clearInterval(this.talkInterval);
        }
        
        this.isTalking = true;
        let mouthOpen = false;
        
        this.talkInterval = setInterval(() => {
            mouthOpen = !mouthOpen;
            if (this.avatarParts && this.avatarParts.mouth) {
                this.avatarParts.mouth.scaling.y = mouthOpen ? 0.3 : 0.15;
            }
        }, 150);
    }

    stopTalking() {
        this.isTalking = false;
        
        if (this.talkInterval) {
            clearInterval(this.talkInterval);
            this.talkInterval = null;
        }
        
        if (this.avatarParts && this.avatarParts.mouth) {
            this.avatarParts.mouth.scaling.y = 0.15;
        }
    }

    changeExpression(expression) {
        if (!this.avatarParts || !this.avatarParts.mouth) return;

        switch (expression) {
            case 'happy':
                // Smile
                this.avatarParts.mouth.scaling.x = 1.4;
                this.avatarParts.mouth.scaling.y = 0.2;
                this.avatarParts.mouth.position.x = 0;
                break;
                
            case 'sad':
                // Frown
                this.avatarParts.mouth.scaling.x = 1.3;
                this.avatarParts.mouth.scaling.y = 0.1;
                this.avatarParts.mouth.position.y = 1.53;
                break;
                
            case 'neutral':
            default:
                // Neutral
                this.avatarParts.mouth.scaling.x = 1.2;
                this.avatarParts.mouth.scaling.y = 0.15;
                this.avatarParts.mouth.position.y = 1.55;
                this.avatarParts.mouth.position.x = 0;
                break;
        }
    }

    resetAvatar() {
        this.stopTalking();
        this.changeExpression('neutral');
        
        if (this.avatar) {
            this.avatar.rotation.y = 0;
        }
        
        if (this.avatarParts && this.avatarParts.body) {
            this.avatarParts.body.scaling.y = 1;
        }
    }

    nodHead() {
        if (!this.avatarParts || !this.avatarParts.head) return;
        
        // Simple head nod animation
        const originalRotation = this.avatarParts.head.rotation.x;
        this.avatarParts.head.rotation.x = originalRotation + 0.3;
        
        setTimeout(() => {
            if (this.avatarParts && this.avatarParts.head) {
                this.avatarParts.head.rotation.x = originalRotation;
            }
        }, 400);
    }

    wave() {
        if (!this.avatarParts || !this.avatarParts.rightArm) return;
        
        // Simple wave animation
        const originalRotation = this.avatarParts.rightArm.rotation.z;
        this.avatarParts.rightArm.rotation.z = originalRotation - 1.0;
        
        setTimeout(() => {
            if (this.avatarParts && this.avatarParts.rightArm) {
                this.avatarParts.rightArm.rotation.z = originalRotation;
            }
        }, 600);
    }
}

// Global avatar instance
let avatar;

// Initialize avatar when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing 3D Avatar...");
    avatar = new AvatarController('renderCanvas');
});

// Global functions for HTML buttons
function changeAvatarExpression(expression) {
    if (avatar) {
        avatar.changeExpression(expression);
    }
}

function resetAvatar() {
    if (avatar) {
        avatar.resetAvatar();
    }
}

function waveAvatar() {
    if (avatar) {
        avatar.wave();
    }
}
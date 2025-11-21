/**
 * AvatarManager - Advanced 3D Avatar Control System
 * Creates and animates a realistic human avatar with emotions, lip-sync, and natural body language
 */

class AvatarManager {
    constructor(scene) {
        try {
            console.log('🤖 AvatarManager constructor started');
            this.scene = scene;
            this.avatar = null;
            this.parts = {};
            this.animations = {};
            this.currentEmotion = 'neutral';
            this.isSpeaking = false;
            this.blinkInterval = null;
            this.idleAnimationTime = 0;
            
            console.log('🎨 Creating avatar meshes...');
            this.createAvatar();
            console.log('📚 Setting up animations...');
            this.setupAnimations();
            console.log('✅ AvatarManager initialized successfully!');
        } catch (error) {
            console.error('❌ Error in AvatarManager constructor:', error);
            console.error('Stack trace:', error.stack);
            throw error;
        }
    }

    createAvatar() {
        // Main avatar group
        this.avatar = new BABYLON.TransformNode('avatar', this.scene);
        
        // === HEAD ===
        const headMaterial = this.createSkinMaterial();
        const head = BABYLON.MeshBuilder.CreateSphere('head', { 
            diameter: 0.45, 
            segments: 64 
        }, this.scene);
        head.position.y = 1.8;
        head.material = headMaterial;
        head.castShadow = true;
        head.parent = this.avatar;
        this.parts.head = head;
        
        // === HAIR ===
        const hairMaterial = this.createMaterial(0x4a3f83, 0.5, 0.1);
        const hairTop = BABYLON.MeshBuilder.CreateSphere('hairTop', { 
            diameter: 0.48, 
            segments: 32,
            slice: 0.6
        }, this.scene);
        hairTop.position.set(0, 2.0, 0);
        hairTop.material = hairMaterial;
        hairTop.parent = this.avatar;
        
        const hairSide1 = BABYLON.MeshBuilder.CreateBox('hairSide1', { 
            width: 0.15, 
            height: 0.35, 
            depth: 0.2 
        }, this.scene);
        hairSide1.position.set(-0.27, 1.75, 0);
        hairSide1.material = hairMaterial;
        hairSide1.parent = this.avatar;
        
        const hairSide2 = hairSide1.clone('hairSide2');
        hairSide2.position.x = 0.27;
        hairSide2.parent = this.avatar;
        
        // === EYES ===
        this.createEyes();
        
        // === EYEBROWS ===
        this.createEyebrows();
        
        // === NOSE ===
        const noseMat = this.createSkinMaterial();
        const nose = BABYLON.MeshBuilder.CreateBox('nose', { 
            width: 0.04, 
            height: 0.12, 
            depth: 0.08 
        }, this.scene);
        nose.position.set(0, 1.75, 0.32);
        nose.material = noseMat;
        nose.parent = this.avatar;
        
        // === MOUTH ===
        this.createMouth();
        
        // === NECK ===
        const neckMat = this.createSkinMaterial();
        const neck = BABYLON.MeshBuilder.CreateCylinder('neck', { 
            diameter: 0.15, 
            height: 0.15 
        }, this.scene);
        neck.position.y = 1.56;
        neck.material = neckMat;
        neck.parent = this.avatar;
        
        // === BODY ===
        this.createBody();
        
        // === ARMS ===
        this.createArms();
        
        // === HANDS ===
        this.createHands();
        
        // === LEGS ===
        this.createLegs();
        
        console.log('✓ Realistic 3D avatar created successfully!');
    }

    createSkinMaterial() {
        const material = new BABYLON.StandardMaterial('skinMat' + Math.random(), this.scene);
        material.diffuseColor = new BABYLON.Color3(0.95, 0.82, 0.70);
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        material.specularPower = 32;
        material.emissiveColor = new BABYLON.Color3(0.1, 0.08, 0.06);
        return material;
    }

    createMaterial(color, roughness, metalness, emissive = null) {
        const material = new BABYLON.StandardMaterial('mat' + Math.random(), this.scene);
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;
        material.diffuseColor = new BABYLON.Color3(r / 255, g / 255, b / 255);
        material.specularColor = new BABYLON.Color3(metalness, metalness, metalness);
        material.specularPower = 64 * (1 - roughness);
        if (emissive) {
            const er = (emissive >> 16) & 0xff;
            const eg = (emissive >> 8) & 0xff;
            const eb = emissive & 0xff;
            material.emissiveColor = new BABYLON.Color3(er / 255 * 0.1, eg / 255 * 0.1, eb / 255 * 0.1);
        }
        return material;
    }

    createEyes() {
        // Eye group
        const eyeL = new BABYLON.TransformNode('eyeL', this.scene);
        eyeL.position.set(-0.13, 1.85, 0.32);
        eyeL.parent = this.avatar;
        
        const eyeWhiteL = BABYLON.MeshBuilder.CreateSphere('eyeWhiteL', { 
            diameter: 0.1, 
            segments: 24 
        }, this.scene);
        const eyeWhiteMat = this.createMaterial(0xffffff, 0.1, 0.05);
        eyeWhiteL.material = eyeWhiteMat;
        eyeWhiteL.parent = eyeL;
        
        // Iris
        const irisL = BABYLON.MeshBuilder.CreateSphere('irisL', { 
            diameter: 0.06, 
            segments: 20 
        }, this.scene);
        const irisMat = this.createMaterial(0x6b4423, 0.2, 0.1);
        irisL.material = irisMat;
        irisL.position.z = 0.03;
        irisL.parent = eyeL;
        
        // Pupil
        const pupilL = BABYLON.MeshBuilder.CreateSphere('pupilL', { 
            diameter: 0.032, 
            segments: 16 
        }, this.scene);
        const pupilMat = this.createMaterial(0x000000, 0.05, 0.02);
        pupilL.material = pupilMat;
        pupilL.position.z = 0.048;
        pupilL.parent = eyeL;
        
        // Eye shine
        const shineL = BABYLON.MeshBuilder.CreateSphere('shineL', { 
            diameter: 0.016, 
            segments: 12 
        }, this.scene);
        const shineMat = new BABYLON.StandardMaterial('shineMat' + Math.random(), this.scene);
        shineMat.emissiveColor = new BABYLON.Color3(0.9, 0.9, 1);
        shineL.material = shineMat;
        shineL.position.set(-0.01, 0.015, 0.055);
        shineL.parent = eyeL;
        
        // Right eye
        const eyeR = eyeL.clone('eyeR');
        eyeR.position.x = 0.13;
        eyeR.parent = this.avatar;
        
        this.parts.eyeL = eyeL;
        this.parts.eyeR = eyeR;
        this.parts.pupilL = pupilL;
        this.parts.pupilR = pupilL.parent.children[2];
    }

    createEyebrows() {
        const eyebrowMat = this.createMaterial(0x4a3f83, 0.6, 0);
        
        const brow1 = BABYLON.MeshBuilder.CreateBox('brow1', { 
            width: 0.12, 
            height: 0.025, 
            depth: 0.02 
        }, this.scene);
        brow1.position.set(-0.13, 1.92, 0.32);
        brow1.rotation.z = -0.1;
        brow1.material = eyebrowMat;
        brow1.parent = this.avatar;
        this.parts.browL = brow1;
        
        const brow2 = brow1.clone('brow2');
        brow2.position.x = 0.13;
        brow2.rotation.z = 0.1;
        brow2.parent = this.avatar;
        this.parts.browR = brow2;
    }

    createMouth() {
        const mouthMat = this.createMaterial(0xb85c75, 0.4, 0);
        
        const mouth = BABYLON.MeshBuilder.CreateBox('mouth', { 
            width: 0.18, 
            height: 0.05, 
            depth: 0.04 
        }, this.scene);
        mouth.position.set(0, 1.64, 0.33);
        mouth.material = mouthMat;
        mouth.parent = this.avatar;
        this.parts.mouth = mouth;
        
        // Tongue (hidden by default)
        const tongue = BABYLON.MeshBuilder.CreateBox('tongue', { 
            width: 0.12, 
            height: 0.02, 
            depth: 0.05 
        }, this.scene);
        const tongueMat = this.createMaterial(0xc4537b, 0.5, 0);
        tongue.material = tongueMat;
        tongue.position.set(0, 1.62, 0.38);
        tongue.parent = this.avatar;
        this.parts.tongue = tongue;
    }

    createBody() {
        // Shirt material
        const shirtMat = this.createMaterial(0xf5f5f5, 0.7, 0);
        
        const shirt = BABYLON.MeshBuilder.CreateBox('shirt', { 
            width: 0.35, 
            height: 0.65, 
            depth: 0.2 
        }, this.scene);
        shirt.position.y = 1.15;
        shirt.material = shirtMat;
        shirt.parent = this.avatar;
        this.parts.shirt = shirt;
        
        // Jacket material
        const jacketMat = this.createMaterial(0x2a2a2a, 0.5, 0.1);
        
        const jacket = BABYLON.MeshBuilder.CreateCylinder('jacket', { 
            diameter: 0.45, 
            height: 0.7 
        }, this.scene);
        jacket.position.y = 1.12;
        jacket.material = jacketMat;
        jacket.parent = this.avatar;
        this.parts.jacket = jacket;
        
        // Pants
        const pantsMat = this.createMaterial(0x1a1a1a, 0.6, 0.05);
        
        const pantsL = BABYLON.MeshBuilder.CreateCylinder('pantsL', { 
            diameter: 0.2, 
            height: 0.9 
        }, this.scene);
        pantsL.position.set(-0.12, 0.3, 0);
        pantsL.material = pantsMat;
        pantsL.parent = this.avatar;
        
        const pantsR = pantsL.clone('pantsR');
        pantsR.position.x = 0.12;
        pantsR.parent = this.avatar;
    }

    createArms() {
        const jacketMat = this.createMaterial(0x2a2a2a, 0.5, 0.1);
        const skinMat = this.createSkinMaterial();
        
        // Left arm
        const armL = new BABYLON.TransformNode('armL', this.scene);
        armL.position.set(-0.32, 1.2, 0);
        armL.parent = this.avatar;
        
        const armLUpper = BABYLON.MeshBuilder.CreateCylinder('armLUpper', { 
            diameter: 0.1, 
            height: 0.5 
        }, this.scene);
        armLUpper.position.y = -0.2;
        armLUpper.material = jacketMat;
        armLUpper.parent = armL;
        
        const armLLower = BABYLON.MeshBuilder.CreateCylinder('armLLower', { 
            diameter: 0.09, 
            height: 0.45 
        }, this.scene);
        armLLower.position.y = -0.55;
        armLLower.material = jacketMat;
        armLLower.parent = armL;
        
        this.parts.armL = armL;
        
        // Right arm
        const armR = armL.clone('armR');
        armR.position.x = 0.32;
        armR.parent = this.avatar;
        this.parts.armR = armR;
    }

    createHands() {
        const skinMat = this.createSkinMaterial();
        
        // Left hand
        const handL = BABYLON.MeshBuilder.CreateSphere('handL', { 
            diameter: 0.08, 
            segments: 20 
        }, this.scene);
        handL.position.set(-0.32, 0.35, 0);
        handL.material = skinMat;
        handL.scale.z = 0.7;
        handL.parent = this.avatar;
        this.parts.handL = handL;
        
        // Right hand
        const handR = handL.clone('handR');
        handR.position.x = 0.32;
        handR.parent = this.avatar;
        this.parts.handR = handR;
    }

    createLegs() {
        const pantsMat = this.createMaterial(0x1a1a1a, 0.6, 0.05);
        const shoeMat = this.createMaterial(0x0a0a0a, 0.7, 0.05);
        
        // Left leg
        const legL = BABYLON.MeshBuilder.CreateCylinder('legL', { 
            diameter: 0.15, 
            height: 0.9 
        }, this.scene);
        legL.position.set(-0.12, 0.3, 0);
        legL.material = pantsMat;
        legL.parent = this.avatar;
        
        const shoeL = BABYLON.MeshBuilder.CreateBox('shoeL', { 
            width: 0.15, 
            height: 0.08, 
            depth: 0.25 
        }, this.scene);
        shoeL.position.set(-0.12, -0.52, 0.05);
        shoeL.material = shoeMat;
        shoeL.parent = this.avatar;
        
        // Right leg
        const legR = legL.clone('legR');
        legR.position.x = 0.12;
        legR.parent = this.avatar;
        
        const shoeR = shoeL.clone('shoeR');
        shoeR.position.x = 0.12;
        shoeR.parent = this.avatar;
    }

    setupAnimations() {
        // Start idle animation loop
        this.scene.registerBeforeRender(() => {
            this.idleAnimationTime += 0.016; // ~60fps
            this.updateIdleAnimations();
        });
        
        // Start random blinking
        this.startBlinking();
    }

    updateIdleAnimations() {
        if (this.isSpeaking) return;
        
        const t = this.idleAnimationTime;
        
        // Subtle head bob
        this.parts.head.rotation.y = Math.sin(t * 0.5) * 0.03;
        this.parts.head.position.y = 1.8 + Math.sin(t * 0.8) * 0.01;
        
        // Breathing
        if (this.parts.jacket) {
            this.parts.jacket.scaling.z = 1 + Math.sin(t * 1.5) * 0.02;
        }
        
        // Subtle arm sway
        if (this.parts.armL) {
            this.parts.armL.rotation.z = Math.sin(t * 0.4) * 0.05;
        }
        if (this.parts.armR) {
            this.parts.armR.rotation.z = Math.sin(t * 0.4) * -0.05;
        }
        
        // Eye movement (look around occasionally)
        if (Math.sin(t * 0.2) > 0.95) {
            const lookX = Math.sin(t * 0.1) * 0.02;
            if (this.parts.eyeL) {
                this.parts.eyeL.rotation.z = lookX;
            }
            if (this.parts.eyeR) {
                this.parts.eyeR.rotation.z = lookX;
            }
        }
    }

    startBlinking() {
        this.blinkInterval = setInterval(() => {
            if (!this.isSpeaking && Math.random() > 0.7) {
                this.blink();
            }
        }, 3000 + Math.random() * 2000);
    }

    blink() {
        if (this.parts.eyeL && this.parts.eyeR) {
            const originalScaleY = this.parts.eyeL.scaling.y;
            this.parts.eyeL.scaling.y = 0.1;
            this.parts.eyeR.scaling.y = 0.1;
            
            setTimeout(() => {
                if (this.parts.eyeL) this.parts.eyeL.scaling.y = originalScaleY;
                if (this.parts.eyeR) this.parts.eyeR.scaling.y = originalScaleY;
            }, 100);
        }
    }

    setEmotion(emotion, intensity = 0.5) {
        this.currentEmotion = emotion;
        
        // Adjust eyebrows
        const browRaiseAmount = intensity * 0.3;
        const browRotation = intensity * 0.2;
        
        switch(emotion) {
            case 'happy':
                if (this.parts.browL) this.parts.browL.position.y += 0.01;
                if (this.parts.browR) this.parts.browR.position.y += 0.01;
                if (this.parts.mouth) this.parts.mouth.scaling.x = 1.4;
                break;
                
            case 'sad':
                if (this.parts.browL) {
                    this.parts.browL.position.y -= 0.01;
                    this.parts.browL.rotation.z = -0.3;
                }
                if (this.parts.browR) {
                    this.parts.browR.position.y -= 0.01;
                    this.parts.browR.rotation.z = 0.3;
                }
                if (this.parts.mouth) this.parts.mouth.scaling.y = 0.7;
                break;
                
            case 'surprised':
                if (this.parts.browL) this.parts.browL.position.y += 0.03;
                if (this.parts.browR) this.parts.browR.position.y += 0.03;
                if (this.parts.mouth) {
                    this.parts.mouth.scaling.y = 1.5;
                    this.parts.mouth.scaling.x = 1.2;
                }
                this.eyesWide();
                break;
                
            case 'neutral':
            default:
                this.resetExpression();
        }
    }

    resetExpression() {
        if (this.parts.browL) {
            this.parts.browL.position.y = 1.92;
            this.parts.browL.rotation.z = -0.1;
        }
        if (this.parts.browR) {
            this.parts.browR.position.y = 1.92;
            this.parts.browR.rotation.z = 0.1;
        }
        if (this.parts.mouth) {
            this.parts.mouth.scaling.set(1, 1, 1);
        }
    }

    eyesWide() {
        if (this.parts.eyeL && this.parts.eyeR) {
            this.parts.eyeL.scaling.set(1.2, 1.3, 1.2);
            this.parts.eyeR.scaling.set(1.2, 1.3, 1.2);
        }
    }

    startTalking(duration = 3000) {
        this.isSpeaking = true;
        const startTime = Date.now();
        
        const talkInterval = setInterval(() => {
            if (!this.isSpeaking) {
                clearInterval(talkInterval);
                return;
            }
            
            // Animate mouth opening/closing
            const mouthOpen = Math.random() > 0.5;
            if (this.parts.mouth) {
                this.parts.mouth.scaling.y = mouthOpen ? 1.8 : 0.9;
            }
            
            // Head movement while talking
            if (this.parts.head) {
                this.parts.head.rotation.x = (Math.random() - 0.5) * 0.1;
            }
            
            // Check if talk duration exceeded
            if (Date.now() - startTime > duration) {
                clearInterval(talkInterval);
                this.stopTalking();
            }
        }, 150);
    }

    stopTalking() {
        this.isSpeaking = false;
        if (this.parts.mouth) {
            this.parts.mouth.scaling.y = 1;
        }
        if (this.parts.head) {
            this.parts.head.rotation.x = 0;
        }
    }

    nod() {
        if (this.parts.head) {
            const originalRotation = this.parts.head.rotation.x;
            this.parts.head.rotation.x = originalRotation + 0.4;
            setTimeout(() => {
                if (this.parts.head) {
                    this.parts.head.rotation.x = originalRotation - 0.1;
                    setTimeout(() => {
                        if (this.parts.head) {
                            this.parts.head.rotation.x = originalRotation;
                        }
                    }, 150);
                }
            }, 200);
        }
    }

    wave() {
        if (this.parts.armR) {
            const originalRotation = this.parts.armR.rotation.z;
            let waveCount = 0;
            
            const wave = () => {
                this.parts.armR.rotation.z = originalRotation - 1.2;
                setTimeout(() => {
                    if (this.parts.armR) {
                        this.parts.armR.rotation.z = originalRotation - 0.6;
                        waveCount++;
                        if (waveCount < 3) {
                            setTimeout(wave, 250);
                        } else {
                            this.parts.armR.rotation.z = originalRotation;
                        }
                    }
                }, 150);
            };
            
            wave();
        }
    }

    lookAtPosition(x, y, z) {
        // Make avatar look at a specific position
        if (this.parts.head) {
            const avatarPos = this.avatar.getAbsolutePosition();
            const dx = x - avatarPos.x;
            const dy = y - (avatarPos.y + 1.8);
            const dz = z - avatarPos.z;
            
            this.parts.head.rotation.y = Math.atan2(dx, dz) * 0.5;
            this.parts.head.rotation.x = -Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * 0.5;
        }
    }
}

//暂时用不到的一部分代码放在这里

//加载有动画效果的gltf文件
let mixer = null
gltfLoader.load(
    '/models/Fox/glTF/Fox.gltf',
    (gltf) =>
    {   
        gltf.scene.scale.set(0.025, 0.025, 0.025)
        gltf.scene.position.set(3,0,-3)
        //Animation
        mixer = new THREE.AnimationMixer(gltf.scene)
        const action = mixer.clipAction(gltf.animations[2])
        action.play()
        scene.add(gltf.scene)
    }
)






/**
 * Textures
 */
 const textureLoader = new THREE.TextureLoader()
 const doorColorTexture = textureLoader.load('/textures/door/color.jpg')
 const doorAlphaTexture = textureLoader.load('/textures/door/alpha.jpg')
 const doorAmbTexture = textureLoader.load('/textures/door/ambientOcclusion.jpg')
 const doorHeightTexture = textureLoader.load('/textures/door/height.jpg')
 const doorNormalTexture = textureLoader.load('/textures/door/normal.jpg')
 const doorMetalnessTexture = textureLoader.load('/textures/door/metalness.jpg')
 const doorRoughnessTexture = textureLoader.load('/textures/door/roughness.jpg')
 
 const bricksColor = textureLoader.load('/textures/bricks/color.jpg')
 const bricksAmb = textureLoader.load('/textures/bricks/ambientOcclusion.jpg')
 const bricksNormal = textureLoader.load('/textures/bricks/normal.jpg')
 const bricksRough = textureLoader.load('/textures/bricks/roughness.jpg')
 
 const grassColor = textureLoader.load('/textures/grass/color.jpg')
 const grassAmb = textureLoader.load('/textures/grass/ambientOcclusion.jpg')
 const grassNormal = textureLoader.load('/textures/grass/normal.jpg')
 const grassRough = textureLoader.load('/textures/grass/roughness.jpg')
 
 grassAmb.repeat.set(8, 8)
 grassColor.repeat.set(8, 8)
 grassNormal.repeat.set(8,8)
 grassRough.repeat.set(8, 8)
 
 grassAmb.wrapS = THREE.RepeatWrapping
 grassColor.wrapS = THREE.RepeatWrapping
 grassNormal.wrapS = THREE.RepeatWrapping
 grassRough.wrapS = THREE.RepeatWrapping
 
 grassAmb.wrapT = THREE.RepeatWrapping
 grassColor.wrapT = THREE.RepeatWrapping
 grassNormal.wrapT = THREE.RepeatWrapping
 grassRough.wrapT = THREE.RepeatWrapping
 
 /**
  * House
  */
 const house = new THREE.Group()
 scene.add(house)
 //walls
 const walls = new THREE.Mesh(
     new THREE.BoxBufferGeometry(4,2.5,4),
     new THREE.MeshStandardMaterial({
         map: bricksColor,
         aoMap: bricksAmb,
         normalMap: bricksNormal,
         roughnessMap: bricksRough
     })
 )
 walls.geometry.setAttribute(
     'uv2',
     new THREE.Float32BufferAttribute(walls.geometry.attributes.uv.array, 2)
 )
 walls.position.y = 1.25
 house.add(walls)
 // roof
 const roof = new THREE.Mesh(
     new THREE.ConeBufferGeometry(3.5, 1, 4),
     new THREE.MeshStandardMaterial({color:'#b35f45'})
 )
 roof.rotation.y = Math.PI * 0.25
 roof.position.y = 3
 house.add(roof)
 //door
 const door = new THREE.Mesh(
     new THREE.PlaneBufferGeometry(2.2, 2.2, 100, 100),
     new THREE.MeshStandardMaterial({
         map: doorColorTexture,
         transparent: true,
         alphaMap: doorAlphaTexture,
         aoMap: doorAmbTexture,
         displacementMap: doorHeightTexture,
         displacementScale: 0.1,
         normalMap: doorNormalTexture,
         metalnessMap: doorMetalnessTexture,
         roughnessMap: doorRoughnessTexture
     })
 )
 door.geometry.setAttribute(
     'uv2',
     new THREE.Float32BufferAttribute(door.geometry.attributes.uv.array, 2)
 )
 door.position.y = 1
 door.position.z = 2.001
 house.add(door)
 house.position.z = -5
 
 
 // Floor
 const floor = new THREE.Mesh(
     new THREE.PlaneBufferGeometry(100, 100),
     new THREE.MeshStandardMaterial({ 
         map: grassColor,
         aoMap: grassAmb,
         normalMap: grassNormal,
         roughnessMap: grassRough
      })
     
 )
 floor.geometry.setAttribute(
     'uv2',
     new THREE.Float32BufferAttribute(floor.geometry.attributes.uv.array, 2)
 )
 floor.rotation.x = - Math.PI * 0.5
 floor.position.y = 0
 scene.add(floor)
 //doorLight 
const doorLight = new  THREE.PointLight('#ff7d46', 1, 7)
doorLight.position.set(0, 2.2, 2.7)
house.add(doorLight)
doorLight.shadow.mapSize.width = 256
doorLight.shadow.mapSize.height = 256
doorLight.shadow.camera.far = 7
doorLight.castShadow = true
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { TetrahedronGeometry } from 'three'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

//fog
const fog = new THREE.Fog('skyblue', 1, 100)

// Scene
const scene = new THREE.Scene()
//scene.fog = fog

/**
 * Models
 */
const gltfLoader = new GLTFLoader()

//加载有动画效果的gltf文件
let mixer = null
gltfLoader.load(
    '/models/Fox/glTF/Fox.gltf',
    (gltf) =>
    {
        gltf.scene.scale.set(0.025, 0.025, 0.025)
        scene.add(gltf.scene)
        gltf.scene.position.x= 5
        //Animation
        mixer = new THREE.AnimationMixer(gltf.scene)
        const action = mixer.clipAction(gltf.animations[2])
        action.play()
    }
)

//加载模型文件 
//.push()添加至末尾 .pop()删除末尾 .unshift()添加至开头 .splice()切片
//moudelMessage[路径，长，宽，高，X，Y，Z]
var modelsMessage = []
modelsMessage.push('/models/cctv/CCTV.gltf',0.3,0.3,0.3,-5,0,0)
modelsMessage.push('/models/car/scene.gltf',1,1,1,0,0,-10)
modelsMessage.push('/models/test/column.gltf',1,1,1,10,0,0)
modelsMessage.push('/models/test/notice-board.gltf',1,1,1,-15,0,0)
modelsMessage.push('/models/test/rubbish-bin.gltf',0.3,0.3,0.3,0,0,5)
loadModels(modelsMessage)



function loadModels(modelsMessage){
    const numbers  = modelsMessage.length/7
    //console.log(numbers)
    for(var i = 0 ; i < numbers; i++){
        const x = i * 7
        gltfLoader.load(
            modelsMessage[0+x],
            (gltf) =>
            {
                gltf.scene.scale.set(
                    modelsMessage[1+x], 
                    modelsMessage[2+x], 
                    modelsMessage[3+x])
                gltf.scene.position.x=modelsMessage[4+x]
                gltf.scene.position.y=modelsMessage[5+x]
                gltf.scene.position.z=modelsMessage[6+x]
                scene.add(gltf.scene)
                
            }
        )
    }
}


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

/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight('#b9d5ff', 0.5)
gui.add(ambientLight, 'intensity').min(0).max(1).step(0.001)
scene.add(ambientLight)

// Directional light
const moonLight = new THREE.DirectionalLight('#b9d5ff', 0.5)
moonLight.position.set(4, 5, - 2)
gui.add(moonLight, 'intensity').min(0).max(1).step(0.001)
gui.add(moonLight.position, 'x').min(- 5).max(5).step(0.001)
gui.add(moonLight.position, 'y').min(- 5).max(5).step(0.001)
gui.add(moonLight.position, 'z').min(- 5).max(5).step(0.001)
scene.add(moonLight)

//doorLight 
const doorLight = new  THREE.PointLight('#ff7d46', 1, 7)
doorLight.position.set(0, 2.2, 2.7)
house.add(doorLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 500)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 5
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
//控制摄像机保持在水平面以上
controls.maxPolarAngle = Math.PI * 0.5 - 0.1

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor('skyblue')
//renderer.outputEncoding = THREE.sRGBEncoding
//shadows
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

moonLight.castShadow = true
doorLight.castShadow = true

walls.castShadow = true
floor.receiveShadow = true

doorLight.shadow.mapSize.width = 256
doorLight.shadow.mapSize.height = 256
doorLight.shadow.camera.far = 7


/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Model animation
    if(mixer)
    {
        mixer.update(deltaTime)
    }

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
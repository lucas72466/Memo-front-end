import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { TetrahedronGeometry } from 'three'

//初始化对象
var gui, canvas, fog, scene, plane, sizes, ambientLight, moonLight, renderer, controls, camera

init()
function init(){
    // Debug
    gui = new dat.GUI()
    // Canvas
    canvas = document.querySelector('canvas.webgl')
    //Fog
    fog = new THREE.Fog("rgb(135,206,250)", 0.1, 40)
    // Scene
    scene = new THREE.Scene()
    scene.fog = fog
    //Plane
    plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(100, 100),
        new THREE.MeshStandardMaterial()  
    )
    //获取光影
    plane.receiveShadow = true
    plane.rotation.x = - Math.PI * 0.5
    plane.position.y = 0
    scene.add(plane)
    //页面大小
    sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    }
    // Ambient light
    ambientLight = new THREE.AmbientLight("rgb(255, 255, 255)", 0.5)
    gui.add(ambientLight, 'intensity').min(0).max(1).step(0.001)
    scene.add(ambientLight)

    // Directional light
    moonLight = new THREE.DirectionalLight("rgb(255,255,255)", 0.5)
    moonLight.position.set(4, 5, - 2)
    gui.add(moonLight, 'intensity').min(0).max(1).step(0.001)
    gui.add(moonLight.position, 'x').min(- 5).max(5).step(0.001)
    gui.add(moonLight.position, 'y').min(- 5).max(5).step(0.001)
    gui.add(moonLight.position, 'z').min(- 5).max(5).step(0.001)
    moonLight.castShadow = true
    scene.add(moonLight)

    //渲染器
    renderer = new THREE.WebGLRenderer({
        canvas: canvas
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    // 天空背景颜色
    renderer.setClearColor("rgb(135,206,250)")
    //保证颜色与blender里的一样
    renderer.outputEncoding = THREE.sRGBEncoding
    
    //shadows
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    moonLight.castShadow = true

    // Base camera
    camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 500)
    camera.position.x = 4
    camera.position.y = 2
    camera.position.z = 4
    scene.add(camera)
    
    // Controls
    controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    //控制摄像机保持在水平面以上
    controls.maxPolarAngle = Math.PI * 0.5 - 0.1
}

//Models
const gltfLoader = new GLTFLoader()

//加载模型文件 
//.push()添加至末尾 .pop()删除末尾 .unshift()添加至开头 .splice()切片
//moudelMessage[路径，长，宽，高，X，Y，Z]
//objectGroup储存模型对象，需要注意里面还有一层scene对象
//numberOfObjects 用来储存所有的对象，要加上非gltf导入对象，在刷新部分有用
var modelsMessage = []
var objectGroup = new THREE.Group()
var numberOfObjects = 7
modelsMessage.push('/models/cctv/CCTV.gltf',0.3,0.3,0.3,-3,0.5,-4)
modelsMessage.push('/models/car/scene.gltf',1,1,1,0,0,-4)
modelsMessage.push('/models/test/column.gltf',0.3,0.3,0.3,-5,2,2)
modelsMessage.push('/models/test/notice-board.gltf',0.3,0.3,0.3,-5,2,-1.5)
modelsMessage.push('/models/test/rubbish-bin.gltf',0.3,0.3,0.3,-3,0.8,-2)
modelsMessage.push('/models/test/untitled.gltf',0.3,0.3,0.3,0,1,5)
loadModels(modelsMessage)

function loadModels(modelsMessage){
    const numbers  = modelsMessage.length/7
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
                //为每个对象进行命名编号，注意只能用字符串类型
                gltf.scene.name = x/7 + 11000 + ''
                //只能为mesh对象添加阴影，将gltf再展开一层
                gltf.scene.traverse( function( node ) {
                    if ( node.isMesh ) { node.castShadow = true; }  
                } );
                objectGroup.add(gltf.scene)             
            }
        )
    }
}

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

//屏幕事件监听之调整屏幕大小
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

//测试物体
const object1 = new THREE.Mesh(
    new THREE.BoxBufferGeometry( 1, 1, 1 ),
    new THREE.MeshStandardMaterial({ color: '#ff0000' })
)
object1.position.y = 0.5
object1.name = '001'
object1.castShadow = true
objectGroup.add(object1)
objectGroup.name = 'papa'
//异常重要,只有在场景加载后，才能在其他地方查到对象
scene.add(objectGroup)

/**
 * Raycaster
 */
 const raycaster = new THREE.Raycaster()
 let currentIntersect = null


 /**
 * Mouse
 */
 const mouse = new THREE.Vector2()
 window.addEventListener('mousemove', (event) =>
 {
     mouse.x = event.clientX / sizes.width * 2 - 1
     mouse.y = - (event.clientY / sizes.height) * 2 + 1
 })
 
 //点击触发事件
 window.addEventListener('click', () =>
 {
    if(currentIntersect)
    {
        object1.material.color.set(0xFFFFFF*Math.random())
    }
 })


/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

tick()
function tick(){
    var x = 0
    x = objectGroup.children.length 
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime
    //初始化射线方向
    raycaster.setFromCamera(mouse, camera)
    
    //很重要！！！！因为从gltf载入group需要时间，所以需要分情况来进行刷新帧率
    if (x < numberOfObjects){
        const objectsToTest = [  
            objectGroup.getObjectByName('001'),        
        ]
        var intersects = raycaster.intersectObjects(objectsToTest, true)

    }else if(x = numberOfObjects){
        const objectsToTest = [
            objectGroup.getObjectByName('001'),
            objectGroup.getObjectByName('11000'),
            objectGroup.getObjectByName('11001'),
            objectGroup.getObjectByName('11002'),
            objectGroup.getObjectByName('11003'),
            objectGroup.getObjectByName('11004'),
            objectGroup.getObjectByName('11005')
        ]
        var intersects = raycaster.intersectObjects(objectsToTest, true)
    }
    
    //存放相交的第一个物体
    if(intersects.length){
        currentIntersect = intersects[0]
    }
    else{
        currentIntersect = null
    }

    // Model animation
    if(mixer){
        mixer.update(deltaTime)
    }

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { LogLuvEncoding, TetrahedronGeometry } from 'three'

//初始化对象
var gui, canvas, fog, scene, plane, sizes, 
    ambientLight, moonLight, renderer, 
    controls, camera, raycaster

init()
function init(){
    // Debug
    gui = new dat.GUI()
    gui.close()
    // Canvas
    canvas = document.querySelector('canvas.webgl')
    //Fog
    fog = new THREE.Fog("rgb(135,206,250)", 0.1, 40)
    // Scene
    scene = new THREE.Scene()
    scene.fog = fog
    //Plane
    plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(20, 20),
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
    camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.01, 500)
    //摄像机位置x,z需要设置为0,否则主物体移动时会产生视角移动，因为camera的实际位置并未改变
    camera.position.set(0,4,0)
    //camera.lookAt( scene.position );
    
    // Controls
    //controls = new OrbitControls(camera, canvas)
    //controls.enableDamping = true
    //控制摄像机保持在水平面以上
    //controls.maxPolarAngle = Math.PI * 0.5 - 0.1

    raycaster = new THREE.Raycaster()
    let currentIntersect = null
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
var numberOfObjects = 8
modelsMessage.push('/models/cctv/CCTV.gltf',0.3,0.3,0.3,-3,0.5,-4)
modelsMessage.push('/models/car/scene.gltf',1,1,1,0,0,-4)
modelsMessage.push('/models/test/column.gltf',0.3,0.3,0.3,-5,2,2)
modelsMessage.push('/models/test/notice-board.gltf',0.3,0.3,0.3,-5,2,-1.5)
modelsMessage.push('/models/test/rubbish-bin.gltf',0.3,0.3,0.3,-3,0.8,-2)
modelsMessage.push('/models/test/untitled.gltf',0.3,0.3,0.3,0,1,5)

plane.name = 'plane'
objectGroup.add(plane)
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

//主物体
var temp = new THREE.Vector3;
var dir = new THREE.Vector3;
var a = new THREE.Vector3;
var b = new THREE.Vector3;
var follow = new THREE.Object3D;
//摄像机与主物体的距离
var coronaSafetyDistance = 6;
var velocity = 0.0;
var speed = 0.0;

const testObject = new THREE.Mesh(
    new THREE.BoxBufferGeometry( 1, 1, 1 ),
    new THREE.MeshStandardMaterial({ color: '#ff0000' })
)
testObject.position.y = 0.5
testObject.name = '001'
testObject.castShadow = true
follow.position.z = -coronaSafetyDistance
follow.position.y = 3
testObject.add( follow )
scene.add(camera)
//主物体的起始位置
testObject.rotateY(-2)
objectGroup.add(testObject)
objectGroup.name = 'papa'
//异常重要,只有在场景加载后，才能在其他地方查到对象
scene.add(objectGroup)



//监听调整屏幕大小
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

//监听键盘输入
const keys = {
    a: false,
    s: false,
    d: false,
    w: false
  };
window.addEventListener( 'keydown', function(e) {
    const key = e.code.replace('Key', '').toLowerCase();
    if ( keys[ key ] !== undefined )
      keys[ key ] = true; 
});
window.addEventListener( 'keyup', function(e) {
    const key = e.code.replace('Key', '').toLowerCase();
    if ( keys[ key ] !== undefined )
      keys[ key ] = false;
});

//监听鼠标移动
const mouse = new THREE.Vector2()
window.addEventListener('mousemove', (event) =>{ 
    mouse.x = event.clientX / sizes.width * 2 - 1
    mouse.y = - (event.clientY / sizes.height) * 2 + 1
  })

//监听鼠标点击和类型
var mouseSwitch = 0
window.addEventListener('click', (event) =>{
     if(currentIntersect){
        if(currentIntersect.object.name != 'plane'){
            testObject.material.color.set(0xFFFFFF*Math.random())
        }
    }
})
//控制鼠标拖动
window.addEventListener('mousedown',()=>{
    mouseSwitch = 1
})
window.addEventListener('mouseup',()=>{
    mouseSwitch = 0
})

//监听触摸屏幕
window.addEventListener('touchend',()=>{
    mouseSwitch = 0
})
window.addEventListener('touchmove',(event)=>{
    mouseSwitch = 2
    mouse.x = (event.touches[0].pageX/window.innerWidth)*2-1
    mouse.y = -(event.touches[0].pageY/window.innerHeight)*2+1
})


//控制主物体移动
function objectMove(){
    //第三人称控制移动，相机距离位置很重要
    speed = 0.0
    //鼠标控制,mouse.y需要进行俯仰角修正
    if(mouseSwitch == 1){
        if(mouse.y + 0.3 > 0 )
        speed = 0.3 * Math.abs(mouse.y + 0.3);
        //if(mouse.y + 0.3 < 0 )
        //speed = -0.2 * Math.abs(mouse.y + 0.3);
        if(mouse.x < 0 )
        testObject.rotateY(0.05 * Math.abs(mouse.x)+0.01);
        if(mouse.x > 0 )
        testObject.rotateY(-0.05 * Math.abs(mouse.x)-0.01);
    }
    //触控屏幕控制
    if(mouseSwitch == 2){
        if(mouse.y + 0.3 > 0 )
        speed = 0.5 * Math.abs(mouse.y + 0.3);
        //if(mouse.y + 0.3 < 0 )
        //speed = -0.5 * Math.abs(mouse.y + 0.3);
        if(mouse.x < 0 )
        testObject.rotateY(0.17 * Math.abs(mouse.x)+0.03);
        if(mouse.x > 0 )
        testObject.rotateY(-0.17 * Math.abs(mouse.x)-0.03);
    }
    //键盘控制
    if(keys.w )
        speed = 0.05;
    if(keys.s )
        speed = -0.05;
    velocity += (speed - velocity) * .3;
    testObject.translateZ(velocity);
    if(keys.a )
        testObject.rotateY(0.05);
    if(keys.d )
        testObject.rotateY(-0.05);
    //a是主物体的渐进物体，用来控制物体移动时镜头速度
    a.lerp(testObject.position, 0.8);
    b.copy(camera.position);
    dir.copy( a ).sub( b ).normalize();
    const dis = a.distanceTo( b ) - coronaSafetyDistance;
    camera.position.addScaledVector( dir, dis );
    
    //物体不移动时，镜头速度
    camera.position.lerp(temp, 0.1);
    temp.setFromMatrixPosition(follow.matrixWorld);
    //镜头观察角度提高
    b.copy(testObject.position)
    camera.lookAt(b.setY(2));
}

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0
let currentIntersect = null

animate()
function animate(){
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
            objectGroup.getObjectByName('11005'),
            objectGroup.getObjectByName('plane')
        ]
        var intersects = raycaster.intersectObjects(objectsToTest, true)
    }
    //存放相交的第一个物体
    if(intersects.length)
        currentIntersect = intersects[0];
    else
        currentIntersect = null;
    
    // Model animation
    if(mixer)
        mixer.update(deltaTime);
    
    //控制主物体移动
    objectMove()
    
    // Update controls 会与第三人称控制产生视角冲突
    //controls.update()
    // Render
    renderer.render(scene, camera)
    // Call animate again on the next frame
    window.requestAnimationFrame(animate)
}
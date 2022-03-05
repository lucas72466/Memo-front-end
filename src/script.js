import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { LogLuvEncoding, TetrahedronBufferGeometry, TetrahedronGeometry } from 'three'

//初始化对象
var gui, canvas, fog, scene, sizes, 
    ambientLight, sunLight, renderer, 
    controls, camera, cameraRaycaster
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
    
    //页面大小
    sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    }
    
    // Ambient light 环境光
    ambientLight = new THREE.AmbientLight("rgb(255, 255, 255)", 0.5)
    gui.add(ambientLight, 'intensity').min(0).max(1).step(0.001)
    scene.add(ambientLight)

    // Directional light 直射太阳光
    sunLight = new THREE.DirectionalLight("rgb(255,255,255)", 0.5)
    sunLight.position.set(20, 20, 20)
    gui.add(sunLight, 'intensity').min(0).max(1).step(0.001)
    gui.add(sunLight.position, 'x').min(-50).max(50).step(1)
    gui.add(sunLight.position, 'y').min(- 50).max(50).step(1)
    gui.add(sunLight.position, 'z').min(- 50).max(50).step(1)
    sunLight.castShadow = true
    //调整直射太阳光的范围参数
    sunLight.shadow.camera = new THREE.OrthographicCamera( -10, 10, 10, -10, 0.5, 200 ); 
    scene.add(sunLight)
    
    //渲染器
    renderer = new THREE.WebGLRenderer({
        canvas: canvas
    })
    renderer.setSize(sizes.width, sizes.height)
    //限制像素渲染值
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    //天空背景颜色
    renderer.setClearColor("rgb(135,206,250)")
    //导入的模型颜色矫正
    renderer.outputEncoding = THREE.sRGBEncoding
    
    //shadows 阴影
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    sunLight.castShadow = true

    // Main camera 主物体摄像机
    camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.01, 500)
    camera.position.set(0,3,0)
    //camera.lookAt( scene.position );
    scene.add(camera)

    
    //Controls 环绕视角控制
    controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    //控制摄像机保持在水平面以上
    controls.maxPolarAngle = Math.PI * 0.5 - 0.1

    cameraRaycaster = new THREE.Raycaster()
    let currentIntersect = null
}

//Models
const gltfLoader = new GLTFLoader()

//加载模型文件 
//.push()添加至末尾 .pop()删除末尾 .unshift()添加至开头 .splice()切片
//mouelMessage[路径，长，宽，高，X，Y，Z]
//modelsGroup储存模型对象，需要注意里面还有一层scene对象
var modelsMessage = []
var modelsGroup = new THREE.Group()
modelsGroup.name = 'papa'
scene.add(modelsGroup)
//numberOfObjects 用来储存所有的对象，要加上非gltf导入对象，在刷新部分有用
var numberOfModels = 6
modelsMessage.push('/models/cctv/CCTV.gltf',0.3,0.3,0.3,-6,-0.1,6.5)
modelsMessage.push('/models/test/square_2.glb',4,4,4,0,-1,-80)
modelsMessage.push('/models/test/column.gltf',0.3,0.3,0.3,5,0.4,1.3)
modelsMessage.push('/models/test/notice-board.gltf',0.3,0.3,0.3,4.7,0.4,13)
modelsMessage.push('/models/test/rubbish-bin.gltf',0.3,0.3,0.3,1.4,0.4,0.6)
//modelsMessage.push('/models/test/chair-3-2.gltf',0.3,0.3,0.3,0,1,5)


loadModels(modelsMessage)
function loadModels(modelsMessage){
    const numbers  = modelsMessage.length/7
    for(var i = 0 ; i < numbers; i++){
        const x = i * 7
        gltfLoader.load(
            //存贮位置信息
            modelsMessage[0+x],
            (gltf) =>{   
                //大小信息与坐标信息
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
                    if ( node.isMesh ){ 
                        node.castShadow = true
                        node.receiveShadow = true
                    }  
                } );
                modelsGroup.add(gltf.scene)             
            }
        )
    }
}

//Main object 主物体
//摄像机与主物体的距离
var coronaSafetyDistance = 6;
var follow = new THREE.Object3D;
const mainObject = new THREE.Mesh(
    new THREE.BoxBufferGeometry( 0.8, 0.8, 0.8),
    new THREE.MeshStandardMaterial({ color: '#ff0000' })
)
mainObject.position.set(0, 0, 0)
mainObject.name = 'mainObject'
//产生阴影
mainObject.castShadow = true
follow.position.z = -coronaSafetyDistance
follow.position.y = 2
mainObject.add( follow )
//主物体的起始位置
//mainObject.rotateY(-3)
modelsGroup.add(mainObject)



//监听屏幕变化
const mouse = new THREE.Vector2()
//1是持续导航事件，2是触摸屏导航事件
var eventSwitch = 0
//用来控制新一轮的导航事件
var moveLock = 0
//控制点击导航事件
var mouseLock1 = 0
//控制拖拽导航事件
var mouseLock2 = 0
//抹除鼠标微小移动带来的操作模糊
var tempX = 0
var tempY = 0
const keys = {a: false,s: false,d: false,w: false};
//只需要调用一次，在刷新里不需要调用
windowChange()
function windowChange(){
    //监听调整屏幕大小
    window.addEventListener('resize', () =>{
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

    //监听鼠标移动, 定位鼠标
    window.addEventListener('mousemove', (event) =>{ 
        mouse.x = event.clientX / sizes.width * 2 - 1
        mouse.y = - (event.clientY / sizes.height) * 2 + 1
        //鼠标移动的模糊值，过滤掉细小的鼠标移动
        tempX = (tempX-mouse.x * 1000) * (tempX-mouse.x * 1000)
        tempY = (tempY-mouse.y * 1000) * (tempY-mouse.y * 1000)
        if(mouseLock2 == 0 && (tempX+tempY) >= 40 ){
            mouseLock1 = 1
            eventSwitch = 1
        }
        tempX = mouse.x * 1000
        tempY = mouse.y * 1000
    })

    //监听鼠标拖动和点击事件
    window.addEventListener('mousedown',(event)=>{
        mouseLock1 = 0
        mouseLock2 = 0
        if(currentIntersect){
            //随机改变主物体颜色
            mainObject.material.color.set(0xFFFFFF*Math.random())
        }
    })
    
    window.addEventListener('mouseup',()=>{
        mouseLock2 = 1
        if (mouseLock1 == 0 && currentIntersect) {
            eventSwitch = 5
            //确保每次点击都能获得新的导航点
            moveLock = 0
            currentIntersect =null
        }
    })
    
    window.addEventListener('click',()=>{
    })
    
    //移入物体时触发
    window.addEventListener('mouseenter',()=>{
    })
        
    window.addEventListener('touchmove',(event)=>{
        mouseLock1 = 1
    })
}


//检测碰撞
var intersectSurfaceBottom = null
var intersectSurfaceFront = null
var intersectSurfaceBack = null
var intersectSurfaceDistance = null
var intersectsWithObject = null
function onIntersect(){
    // 物体中心点坐标
    const centerCoord = mainObject.position.clone()
    // 顶点三维向量
    const vertices = []
    //包围圈，要略大于主物体，否则会检测到主物体
    const temp =  0.65
    //声明不同的检测点坐标
    vertices.push(new THREE.Vector3( temp, temp,  temp))
    vertices.push(new THREE.Vector3(-temp, temp,  temp))
    vertices.push(new THREE.Vector3(-temp, temp, -temp))
    vertices.push(new THREE.Vector3( temp, temp, -temp))
    vertices.push(new THREE.Vector3(0, 0,  temp))
    vertices.push(new THREE.Vector3(0, -temp, 0))
    vertices.push(new THREE.Vector3(0, 0, -temp))
    
    //先创建前和下两条检测线
    for (let i = 4; i < 7; i++) {
      // 获取世界坐标下的检测点坐标
      let vertexWorldCoord = vertices[i].clone().applyMatrix4(mainObject.matrixWorld)
      // 获得由中心指向顶点的向量
      var dir = vertexWorldCoord.clone().sub(centerCoord)
      // 发射光线 centerCoord 为投射的原点向量  dir 向射线提供方向的方向向量
      let raycaster = new THREE.Raycaster(centerCoord, dir.normalize())
      // 放入要检测的 物体cube2，返回相交物体
      intersectsWithObject = raycaster.intersectObjects(objectsToTest, true)
      // 检测是哪个面发生了碰撞
      if (intersectsWithObject.length > 0) {
        if (intersectsWithObject[0].distance < temp) {
            if(i == 5){
                intersectSurfaceBottom = 1
                intersectSurfaceDistance = intersectsWithObject[0].distance
            }else if(i == 4 ){
                intersectSurfaceFront = 1
            }else if(i == 6){
                intersectSurfaceBack = 1
            }
        }
      }
    }
    //检测前后往返四条线
    for (let i = 0; i < 4; i++) {
        //数学方法获得第二点坐标索引
        var a = null 
        if(i%2==0){
            a = i + 1
        }else{
            a = i - 1
        }
        // 获取世界坐标下 网格变换后的 两个点坐标
        let vertexWorldCoord1= vertices[i].clone().applyMatrix4(mainObject.matrixWorld)
        let vertexWorldCoord2 = vertices[a].clone().applyMatrix4(mainObject.matrixWorld)
        // 获得由这个检测点指向下一个检测点的向量
        var dir = vertexWorldCoord2.clone().sub(vertexWorldCoord1)
        // 发射光线 第一个检测点 为投射的原点向量  dir 向射线提供方向的方向向量
        let raycaster = new THREE.Raycaster(vertexWorldCoord1, dir.normalize())
        // 放入要检测的 物体cube2，返回相交物体
        intersectsWithObject = raycaster.intersectObjects(objectsToTest, true)
        // 检测是哪个面发生了碰撞 0，1是前面 2，3是后面
        if (intersectsWithObject.length > 0) {
          if (intersectsWithObject[0].distance < (temp*2) ) {
              if(i == 0 | i == 1){
                  intersectSurfaceFront = 1
              }else{
                  intersectSurfaceBack = 1
              }
          }
        }
      }
  }


//控制主物体移动，让太阳光跟随移动刷新以节约性能
var temp0 = new THREE.Vector3;
var dir = new THREE.Vector3;
var temp1 = new THREE.Vector3;
var temp2 = new THREE.Vector3;
//鼠标点击事件持续运行
var angle = null
var angleDirection = 1
var distance = null
var velocity = 0.0;
var speed = 0.0;
function objectMove(){
    //每次移动开始时取一次固定的光照位置值
    sunLight.position.set(20, 20, 20)
    //第三人称控制移动，相机距离位置很重要
    speed = 0.0

    //点击鼠标移动物体
    if( eventSwitch == 5 | moveLock == 1){
        //通过标记moveLock来完成持续刷新动作
        if(moveLock != 1){
            //将主物体移动到点击位置
            let dir1 = new THREE.Vector3(0, 0, 1)
            let vertexWorldCoord = dir1.clone().applyMatrix4(mainObject.matrixWorld)
            //获得由中心指向前方的向量
            var dir2 = vertexWorldCoord.clone().sub(mainObject.position.clone())
            var dir3 = currentIntersect.point.clone().sub(mainObject.position)
            //获得旋转角和移动距离以及旋转角方向
            angle = dir2.angleTo(dir3)
            distance  = dir2.distanceTo(dir3)
            if(mouse.x > 0){
                angleDirection = -1
            }else{
                angleDirection = 1
            }
            //标记第一遍后运行持续距离改变
            moveLock = 1
        }else if(moveLock == 1){
            if(angle > 0){
                mainObject.rotateY(0.05 * angleDirection)
                angle -= 0.05
            }else if(distance > 0){
                mainObject.translateZ(0.05)
                distance -= 0.05
            }else{
                moveLock = 0,
                //这里要将开关重置，否则会一直是5
                eventSwitch = 0
            }
        }
    }
    
    //键盘控制
    if(keys.w && intersectSurfaceFront != 1)
        speed = 0.05
    if(keys.s && intersectSurfaceBack != 1)
        speed = -0.05
    velocity += (speed - velocity) * .3;
    mainObject.translateZ(speed);
    
    if(keys.a )
        mainObject.rotateY(0.03);
    if(keys.d )
        mainObject.rotateY(-0.03);
    
    //上斜面!!!!!!!!!!
    if(intersectSurfaceBottom == 1){
        mainObject.position.y = (0.5-intersectSurfaceDistance) + mainObject.position.y
    }

    //a是主物体的渐进物体，用来控制物体移动时镜头速度
    temp1.lerp(mainObject.position, 0.1);
    temp2.copy(camera.position);
    dir.copy( temp1 ).sub( temp2 ).normalize();
    const dis = temp1.distanceTo( temp2 ) - coronaSafetyDistance;
    camera.position.addScaledVector( dir, dis );
    controls.update()

    //使用物体位置来改变灯光位置
    sunLight.position.add(mainObject.position)
    sunLight.target = mainObject
   
    //物体不移动时，镜头速度
    camera.position.lerp(temp0, 0.02);
    controls.update()
    temp0.setFromMatrixPosition(follow.matrixWorld);
    //镜头观察角度提高
    temp2.copy(mainObject.position)
    camera.lookAt(temp2.setY(2));
    controls.update()
}


//刷新屏幕动画
const clock = new THREE.Clock()
let previousTime = 0
let currentIntersect = null
var objectsToTest = null
animate()
function animate(){
    //初始化trigger
    intersectSurfaceBack = 0
    intersectSurfaceBottom = 0
    intersectSurfaceFront = 0

    var x = 0
    x = modelsGroup.children.length 
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime
    //初始化射线方向
    cameraRaycaster.setFromCamera(mouse, camera)

    //很重要！！！！因为从gltf载入group需要时间，所以需要分情况来进行刷新帧率
    if (x < numberOfModels){
         objectsToTest = [  
            modelsGroup.getObjectByName('mainObject'),        
        ]
        var intersects = cameraRaycaster.intersectObjects(objectsToTest, true)
    }else if(x = numberOfModels){
         objectsToTest = [
            modelsGroup.getObjectByName('mainObject'),
            modelsGroup.getObjectByName('11000'),
            modelsGroup.getObjectByName('11001'),
            modelsGroup.getObjectByName('11002'),
            modelsGroup.getObjectByName('11003'),
            modelsGroup.getObjectByName('11004'),
            //objectGroup.getObjectByName('11005'),
        ]
        var intersects = cameraRaycaster.intersectObjects(objectsToTest, true)
    }

    //存放相交的第一个物体
    if(intersects.length){
        currentIntersect = intersects[0];
    }
    else
        currentIntersect = null;
    
    // // Model animation
    // if(mixer)
    //     mixer.update(deltaTime);
    
    //检测是否产生碰撞，并且以此来控制物体的移动方向
    let tempMainObject = mainObject.position.clone()
    tempMainObject.add(new THREE.Vector3(0,2,0))
    controls.target = tempMainObject
    //使用trigger来决定物体的视角移动方式
    if(mouseLock1 == 0){
        onIntersect()
        objectMove()  
    }
    
    
    //每帧都要更新镜头控制
    controls.update()
    // Render
    renderer.render(scene, camera)
    // Call animate again on the next frame
    window.requestAnimationFrame(animate)
}
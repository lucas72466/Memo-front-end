    import './style.css'
    import * as THREE from 'three'
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
    import * as dat from 'dat.gui'
    import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
    import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
    import Stats from 'stats.js'
    import { LogLuvEncoding, TetrahedronBufferGeometry, TetrahedronGeometry, WebGLRenderer } from 'three'
    import { io } from "socket.io-client";
    //引入模型数据
    import { modelsMessage } from './modelMessage'
    
    
    //判断用户使用设备
    function IsPC() {
        var userAgentInfo = navigator.userAgent;
        var Agents = ["Android", "iPhone",
            "SymbianOS", "Windows Phone",
            "iPad", "iPod"
        ];
        var flag = true;
        for(var v = 0; v < Agents.length; v++) {
            if(userAgentInfo.indexOf(Agents[v]) > 0) {
                flag = false;
                break;
            }
        }
        return flag;
    }
    
    
    //连接多用户,一行代码就可生效
    const socket = io();
    //用户产生移动后将数据传给服务器
    function clientMove(){
        //将用户的当前位置传回服务器
        socket.emit('clientPosition', mainObject.position)
        //将用户的当前旋转传回服务器, 只要y轴旋转角
        socket.emit('clientRotation', mainObject.rotation.y)
    }
    
    
    //存储客户端位置和方向词典
    var positionDic = {}
    var rotationDic = {}
    //监听位置词典是否发生变化
    socket.on('positionDic', (dic)=>{
        //获取存储所有用户位置的词典
        positionDic = dic
        //更新地图中所有用户的位置
        moveClientObjects()
    })
    socket.on('rotationDic', (dic)=>{
        //获取存储所有用户位置的词典
        rotationDic = dic
    })
    
    //存储当前在线人数
    var NOC = 1 
    //存储所有的在线用户模型
    var clientsGroup = new THREE.Group()
    clientsGroup.name = 'clientsGroup'
    //任意用户位置产生变化后调用
    function moveClientObjects(){
        var n = 0
        //获取当前存在的所有用户数量
        for (var key in positionDic){ ++ n }
        //根据是否存在人数变化来决定是否重新渲染角色
        if ( NOC != n ){
            //client数量一发生变化就清除重建
            scene.remove(clientsGroup)
            clientsGroup = new THREE.Group()
            for (var key in positionDic){
                //判断是不是主物体
                if (socket.id != key) {
                    const clientObject = new THREE.Mesh(
                        new THREE.BoxBufferGeometry( 0.8, 0.8, 0.8),
                        new THREE.MeshStandardMaterial({ color: '#ff0000' })
                    )
                    clientObject.position.set(15, 1.3, -3)
                    clientObject.scale.set(1,2,1)
                    clientObject.rotateY(0)
                    clientObject.name = key
                    clientObject.castShadow = true
                    clientsGroup.add(clientObject)
                }
            }
        }
        //根据位置词典来更新所有的用户位置
        for (var key in positionDic){
            //筛去主物体
            if(socket.id != key){
                let position = positionDic[key]
                //利用ruler来旋转物体
                let rotation = new THREE.Euler(0, rotationDic[key], 0)
                clientsGroup.getObjectByName(key).position.setX(position.x)
                clientsGroup.getObjectByName(key).position.setY(position.y)
                clientsGroup.getObjectByName(key).position.setZ(position.z)
                clientsGroup.getObjectByName(key).setRotationFromEuler(rotation)
            }
        }
        NOC = n
        scene.add(clientsGroup)
    }
    
    
    //初始化对象
    var gui, canvas, fog, scene, sizes, 
        hemisphereLight, sunLight, sunLightPosition, renderer, 
        controls, camera, cameraRaycaster, manager, isPC
    init()
    function init(){
        // Debug
        //  gui = new dat.GUI()
        //  gui.show(deltaTime)

        //判断用户使用设备
        isPC = IsPC()

        //资源加载检查
        manager = new THREE.LoadingManager();

        // Canvas
        canvas = document.querySelector('canvas.webgl')
        //Fog
        fog = new THREE.Fog("rgb(135,205,235)", 1, 100)
        // Scene
        scene = new THREE.Scene()
        //scene.fog = fog
        
        //页面大小
        sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        }
        

        //半球反射光，增加真实度
        hemisphereLight = new THREE.HemisphereLight( "rgb(255,255,255)", "rgb(150,150,150)", 0.5);
        scene.add( hemisphereLight );

        //路灯
        const light = new THREE.PointLight( "rgb(255,97,3)", 2, 20 );
        light.position.set( -0.5, 9, -1.4 );
        light.castShadow = true
        //scene.add( light ); 


        // Directional light 直射太阳光
        sunLight = new THREE.DirectionalLight("rgb(255,255,255)", 0.6)
        sunLightPosition = new THREE.Vector3(20, 20, 20)
        sunLight.position.copy(sunLightPosition)
        sunLight.castShadow = true
        //调整直射太阳光的范围参数
        sunLight.shadow.camera = new THREE.OrthographicCamera();
        sunLight.shadow.camera.near = 0
        sunLight.shadow.camera.far = 80
        sunLight.shadow.camera.left = -50
        sunLight.shadow.camera.right = 50
        sunLight.shadow.camera.top = 50
        sunLight.shadow.camera.bottom = -50
        //调整阴影质量，数越大阴影质量越好
        sunLight.shadow.mapSize = new THREE.Vector2(2048,2048)
        //删除光照阴影导致的条纹，需要随着光照数据而改变
        sunLight.shadow.bias = -0.0016
        scene.add(sunLight)
        
        //渲染器
        renderer = new THREE.WebGLRenderer({
            canvas: canvas
        })
        renderer.setSize(sizes.width, sizes.height)
        //限制像素渲染值
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        //天空背景颜色
        renderer.setClearColor("rgb(135,205,235)")
        //导入的模型颜色矫正
        renderer.outputEncoding = THREE.sRGBEncoding
        //shadows 阴影
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        sunLight.castShadow = true

        // Main camera 主物体摄像机
        camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.01, 500)
        camera.position.set(0,0,0)
        //camera.lookAt( scene.position );
        scene.add(camera)

        
        //Controls 环绕视角控制
        controls = new OrbitControls(camera, canvas)
        controls.enableDamping = true
        //控制摄像机保持在水平面以上
        controls.maxPolarAngle = Math.PI * 0.5

        cameraRaycaster = new THREE.Raycaster()
        let currentIntersect = null
    }
    
    //获取屏幕刷新数据在左上角
    var stats = new Stats();
    stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( stats.dom );
    
    
    //获取书笔和收藏模型
    let book = new THREE.Object3D
    let pencil = new THREE.Object3D
    let star = new THREE.Object3D
    //检测资源加载过程
    manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
        // console.log( 'Started loading file: ' + url + '.\nLoaded ' 
        //             + itemsLoaded + ' of ' + itemsTotal + ' files.' );   
    };
    //检测资源加载完毕后运行
    manager.onLoad = function ( ) {
        //将被检测物体存入
        objectForClick()
        book = modelsGroup.getObjectByName('11004')
        pencil = modelsGroup.getObjectByName('11005')
        star = modelsGroup.getObjectByName('11006')
        //加载完毕后再进行第一次刷新页面
        animate()
    };

    //模型加载器
    const gltfLoader = new GLTFLoader(manager)
    const fbxLoader = new FBXLoader()

    let mixer = null
    fbxLoader.load('/models/test/test5.fbx', function ( object ) {
        //获取动画
        mixer = new THREE.AnimationMixer( object );  
        var action = mixer.clipAction( object.animations[ 0 ] );
        action.play();//播放
        object.traverse( function ( child ) {
        if ( child.isMesh ) {//材质
            child.castShadow = true;
            child.receiveShadow = true; 
            }
        } );
        object.scale.set(0.01, 0.01, 0.01)
        object.position.set(0,10,0)
        scene.add( object );
        
    } );

    //加载模型文件 
    //modelsGroup储存模型对象，需要注意里面还有一层scene对象
    var modelsGroup = new THREE.Group()
    modelsGroup.name = 'modelsGroup'

    //加载模型数据
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

    //添加两个group
    scene.add(modelsGroup)
    scene.add(clientsGroup)
    
    //Main object 主物体
    //摄像机与主物体的距离
    var coronaSafetyDistance = 6;
    var follow = new THREE.Object3D;
    const mainObject = new THREE.Mesh(
        new THREE.BoxBufferGeometry( 0.8, 0.8, 0.8),
        new THREE.MeshStandardMaterial({ color: '#ff0000' })
    )
    mainObject.position.set(15, 0.9, -3)
    mainObject.scale.set(1,2,1)
    mainObject.name = 'mainObject'
    //产生阴影
    mainObject.castShadow = true
    follow.position.z = -coronaSafetyDistance
    follow.position.y = 1.5
    mainObject.add( follow )
    //主物体的起始位置
    mainObject.rotateY(-1)
    modelsGroup.add(mainObject)



    //监听屏幕变化
    const mouse = new THREE.Vector2()
    //1是转动视角事件，2是点击导航事件， 
    var eventSwitch = 0
    //用来控制新一轮的导航事件
    var clickMoveLock = 0
    //控制点击导航事件
    var moveLock1 = 0
    //控制拖拽导航事件 一开始锁定防止视角冲突
    var moveLock2 = 1
    //抹除鼠标微小移动带来的操作模糊
    var tempX = 0
    var tempY = 0
    //存储下一次移动距离
    var nextDistance = 0
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
            moveLock1 = 0
            const key = e.code.replace('Key', '').toLowerCase();
            if ( keys[ key ] !== undefined )
            keys[ key ] = true; 
        });
        window.addEventListener( 'keyup', function(e) {
            const key = e.code.replace('Key', '').toLowerCase();
            if ( keys[ key ] !== undefined )
            keys[ key ] = false;
        });

        //判断是否是pc，避免安卓同时触发两种事件监听
        if (isPC) {
            //监听鼠标移动, 定位鼠标
            window.addEventListener('mousemove', (event) =>{ 
                mouse.x = event.clientX / sizes.width * 2 - 1
                mouse.y = - (event.clientY / sizes.height) * 2 + 1
                //鼠标移动的模糊值，过滤掉细小的鼠标移动
                tempX = (tempX-mouse.x * 1000) * (tempX-mouse.x * 1000)
                tempY = (tempY-mouse.y * 1000) * (tempY-mouse.y * 1000)
                if(moveLock2 == 0 && (tempX+tempY) >= 20){
                    moveLock1 = 1
                    eventSwitch = 1
                }
                tempX = mouse.x * 1000
                tempY = mouse.y * 1000
            })

            //监听鼠标拖动和点击事件
            window.addEventListener('mousedown',(event)=>{
                moveLock1 = 0
                moveLock2 = 0
            })
        
            window.addEventListener('mouseup',()=>{
                moveLock2 = 1
                if (moveLock1 == 0 && currentIntersect) {
                    eventSwitch = 2
                    //确保每次点击都能获得新的导航点
                    clickMoveLock = 0
                    currentIntersect =null
                    //初始化移动距离防止被碰撞检测抵消
                    nextDistance = 0
                }
            })
        }
        
        
        //ios系统需要特殊优化一下 “event.touches[0].pageX ”
        window.addEventListener('touchstart',(event)=>{
            //获取触摸点，以便进行碰撞检测
            mouse.x = event.touches[0].pageX / sizes.width * 2 - 1
            mouse.y = - (event.touches[0].pageY / sizes.height) * 2 + 1
            moveLock1 = 0
            moveLock2 = 0
        })

        window.addEventListener('touchend',()=>{
            moveLock2 = 1
            if (moveLock1 == 0 && currentIntersect) {
                eventSwitch = 2
                //确保每次点击都能获得新的导航点
                clickMoveLock = 0
                currentIntersect =null
                //初始化移动距离防止被碰撞检测抵消
                nextDistance = 0
            }
        })
        
        window.addEventListener('touchmove',(event)=>{
            //鼠标移动的模糊值，过滤掉细小的鼠标移动
            tempX = (tempX-mouse.x * 1000) * (tempX-mouse.x * 1000)
            tempY = (tempY-mouse.y * 1000) * (tempY-mouse.y * 1000)
            if(moveLock2 == 0 && (tempX+tempY) >= 1 ){
                moveLock1 = 1
                eventSwitch = 1
            }
            tempX = mouse.x * 1000
            tempY = mouse.y * 1000
        })
    }


    //检测碰撞, 初始化检测点
    var intersectSurfaceBottom = null
    var intersectSurfaceFront = null
    var intersectSurfaceBack = null
    var intersectSurfaceDistance = null
    var intersectsWithObject = null
    // 顶点三维向量
    const vertices = []
    //包围圈，要略大于主物体，否则会检测到主物体
    const temp =  0.55
    //声明不同的检测点坐标
    vertices.push(new THREE.Vector3( temp, temp,  temp))
    vertices.push(new THREE.Vector3(-temp, temp,  temp))
    vertices.push(new THREE.Vector3(-temp, temp, -temp))
    vertices.push(new THREE.Vector3( temp, temp, -temp))
    vertices.push(new THREE.Vector3(0, 0,  temp))
    vertices.push(new THREE.Vector3(0, -temp, 0))
    vertices.push(new THREE.Vector3(0, 0, -temp))
    function onIntersect(){
        // 物体中心点坐标
        const centerCoord = mainObject.position.clone()
        
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
            if (intersectsWithObject[0].distance < 2*temp) {
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
    var dir = new THREE.Vector3;
    var temp0 = new THREE.Vector3;
    var temp1 = new THREE.Vector3;
    var temp2 = new THREE.Vector3;
    var temp3 = new THREE.Vector3;
    //鼠标点击事件持续运行
    var angle = null
    var angleDirection = 1
    var distance = null
    //区分上一次移动事件是否中途停止
    var moveTrigger = 0
    var velocity = 0.0;
    //根据帧率来控制移动速度
    var moveSpeed = 0.0;
    var speed = 0.0
    //控制总移动开关
    var stopMove = 0
    function mainObjectMove(){
        //第三人称控制移动，相机距离位置很重要
        speed = 0

        //点击鼠标移动物体，判断条件分别是触发信号， 是否获得目标点信号
        if( (eventSwitch == 2 | clickMoveLock == 1)){
            //通过标记clickMoveLock来完成持续刷新动作
            //同时通过判断currentIntersect来防止移动设备的识别错误
            if((clickMoveLock != 1) && currentIntersect){
                //调用二级物体触发方法
                jumpObjects()
                //将主物体移动到点击位置
                let dir1 = new THREE.Vector3(0, 0, 1)
                let vertexWorldCoord = dir1.clone().applyMatrix4(mainObject.matrixWorld)
                //获得由中心指向前方的向量
                var dir2 = vertexWorldCoord.clone().sub(mainObject.position)
                var dir3 = currentIntersect.point.clone().sub(mainObject.position)
                //将所有导航点设置到与物体同一高度处，减少距离误差
                dir3.setY(mainObject.position.y)
                //获得旋转角和移动距离，同时让物体保留一段距离
                angle = dir2.angleTo(dir3)
                distance  = dir2.distanceTo(dir3) - 0.5
                //保存移动距离防止被碰撞检测抵消
                nextDistance = distance
                //使用两个向量叉乘来确定旋转角方向
                let direction = dir2.cross(dir3)
                if(direction.y < 0){
                    angleDirection = -1
                }else{
                    angleDirection = 1
                }
                //标记第一遍后运行持续距离改变
                clickMoveLock = 1
            }else if(clickMoveLock == 1){
                //发生碰撞时清空点导航目标
                if (intersectSurfaceFront == 1) {
                    distance = 0
                    moveTrigger = 1
                }
                if(angle > 0){
                    //每次刷新旋转一定角度
                    mainObject.rotateY(moveSpeed * angleDirection)
                    angle -= moveSpeed
                }else if(distance > 0){
                    //每次刷新前进一定距离
                    mainObject.translateZ(moveSpeed);
                    distance -= moveSpeed
                }else if(intersectSurfaceFront == 0 && moveTrigger == 1){
                    //碰撞后将下一次移动距离赋值
                    distance = nextDistance
                    moveTrigger = 0
                }else{
                    clickMoveLock = 0,
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
        mainObject.translateZ(speed);
        
        if(keys.a )
            mainObject.rotateY(0.03);
        if(keys.d )
            mainObject.rotateY(-0.03);
        
        //上斜面，通过模糊高度变化来控制上行高度
        if(intersectSurfaceBottom == 1){
            mainObject.position.y = (0.8-intersectSurfaceDistance) + mainObject.position.y
        }else if(intersectSurfaceBottom != 1){
            mainObject.position.y = mainObject.position.y - 0.1
        }

        //a是主物体的渐进物体，用来控制物体移动时镜头速度
        temp1.copy(mainObject.position)
        //镜头的观察点上移，同时匹配自由视角转变
        temp1.setY(2)
        temp2.lerp(temp1, 0.8);
        temp3.copy(camera.position);
        let cAndMDistance  = temp1.distanceTo( temp3 )
        //如果摄像机距离和物体太近就启用视角限制转移，否则就用视角自由转移
        if (cAndMDistance <= coronaSafetyDistance) {
            dir.copy( temp2 ).sub( temp3 ).normalize();
            const dis = temp2.distanceTo( temp3 ) - coronaSafetyDistance;
            camera.position.addScaledVector( dir, dis );
        }
        //视角自由转移速度
        var turnSpeed = moveSpeed/4
        camera.position.lerp(temp0, turnSpeed);
        temp0.setFromMatrixPosition(follow.matrixWorld);
    }


    let whetherStand = 0
    let fatherObject = 0
    //点击物体，走近物体时跳出选项
    function jumpObjects(){
        //获取被点击的主物体
        let temp = currentIntersect.object.parent.name + ''
        let tempObject = modelsGroup.getObjectByName(temp)
        if (temp == '') {
            console.log(currentIntersect.object.name + '');
        }
        //第一次将物体立起来
        if(whetherStand == 0){
            book.rotateX(Math.PI*0.5)
            star.rotateX(Math.PI*0.5)
            pencil.rotateX(Math.PI*0.1)
            whetherStand = 1
        }
        //限制只有点击垃圾桶有效
        if(tempObject.name == '11003' || tempObject.name == '11001'  ){
            //存储上一级物体
            fatherObject = tempObject.name
            let tempPosition = tempObject.position.clone()
            book.position.copy(tempPosition)
            pencil.position.copy(tempPosition)
            star.position.copy(tempPosition)
            book.position.add(new THREE.Vector3(0,2.5,0))
            pencil.position.add(new THREE.Vector3(1,2.5,0))
            star.position.add(new THREE.Vector3(-1,2.5,0))
        }
        //当点击三个二级物体时跳到其他控制方法
        if(tempObject.name == '11004'){
            //关闭物体移动
            moveLock1 = 1
            clickBook(fatherObject)
        }
        if(tempObject.name == '11005'){
            //关闭物体移动
            moveLock1 = 1
            clickPencil(fatherObject)
        }
        if(tempObject.name == '11006'){
            //关闭物体移动
            moveLock1 = 1
            clickStar(fatherObject)
        }

    }


    //获取允许被点击的对象集
    var objectsToTest = null
    function objectForClick(){
        //在这里加入允许产生点击交互的物体
        objectsToTest = [
            modelsGroup.getObjectByName('mainObject'),
            modelsGroup.getObjectByName('11000'),
            modelsGroup.getObjectByName('11001'),
            modelsGroup.getObjectByName('11002'),
            modelsGroup.getObjectByName('11003'),
            modelsGroup.getObjectByName('11004'),
            modelsGroup.getObjectByName('11005'),
            modelsGroup.getObjectByName('11006'),
            modelsGroup.getObjectByName('11007'),
            modelsGroup.getObjectByName('11008'),
            modelsGroup.getObjectByName('11009'),
            modelsGroup.getObjectByName('11010'),
            modelsGroup.getObjectByName('11011'),
            modelsGroup.getObjectByName('11012')
        ]

    }
 
    
    let currentIntersect = null
    const clock = new THREE.Clock()
    let previousTime = 0
    //刷新屏幕动画
    function animate(){
        //获得帧率
        const elapsedTime = clock.getElapsedTime()
        let deltaTime = elapsedTime - previousTime
        previousTime = elapsedTime
        let FPS = 1/deltaTime
        //根据帧率来控制物体移动速度
        moveSpeed =  150 / (FPS * 20)

        // Model animation
        if(mixer){
            mixer.update(deltaTime);
        }

        //旋转跳出的三个物体
        book.rotateZ(0.01)
        pencil.rotateY(0.01)
        star.rotateZ(0.01)

        //初始化trigger
        intersectSurfaceBack = 0
        intersectSurfaceBottom = 0
        intersectSurfaceFront = 0
        
        //初始化射线方向
        cameraRaycaster.setFromCamera(mouse, camera)

        var intersectsModels = cameraRaycaster.intersectObjects(objectsToTest, true)
        var intersectsClients = cameraRaycaster.intersectObjects(clientsGroup.children, true)

        //存放相交的第一个物体，先检测被点击对象是否是其他用户，在检测是否是固定物体
        if(intersectsClients.length){
            currentIntersect = intersectsClients[0];
        }else if(intersectsModels.length){
            currentIntersect = intersectsModels[0]
        }else{
            currentIntersect = null;
        }


        //使用trigger来决定物体的视角移动方式
        if(moveLock1 == 0 && stopMove == 0){
            onIntersect()
            mainObjectMove()
            clientMove()
        }
        
        //每帧都要更新镜头控制
        let tempMainObject = mainObject.position.clone()
        tempMainObject.add(new THREE.Vector3(0,2,0))
        controls.target = tempMainObject
        controls.update()
        
        stats.update()
        // Render
        renderer.render(scene, camera)
        // Call animate again on the next frame
        window.requestAnimationFrame(animate)
    }



    function clickPencil(object){
        stopMove = 1
        controls.enabled = false
        //object 用来追逐被点击的物体
        console.log(object);

    }


    function clickBook(object){
        //object 用来追逐被点击的物体
        console.log(object)
        stopMove = 0
        controls.enabled = true
        controls.update()

    }


    function clickStar(object){
        //object 用来追逐被点击的物体
        console.log(object)

    }
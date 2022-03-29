//.push()添加至末尾 .pop()删除末尾 .unshift()添加至开头 .splice()切片
//mouelMessage[路径，长，宽，高，X，Y，Z]
export var modelsMessage = []

modelsMessage.push('/models/cctv/CCTV.gltf',0.5,0.5,0.5,-3,1,-14)
modelsMessage.push('/models/test/column.gltf',0.3,0.3,0.3,-6,2,4)
modelsMessage.push('/models/test/notice-board.gltf',0.3,0.3,0.3,1,0.4,21)
modelsMessage.push('/models/test/rubbish-bin.gltf',0.3,0.3,0.3,2,1.5,-13)

//二级跳出的三个物体先放入地下
modelsMessage.push('/models/test/book.gltf',1.5,1.5,1.5,5,-5,-5)
modelsMessage.push('/models/test/pencil.gltf',1,1,1,5,-5,-5)
modelsMessage.push('/models/test/star.gltf',2,2,2,5,-5,-6)

//其他建筑
modelsMessage.push('/models/building_model/base.gltf',5,5,5,0,0,0)
modelsMessage.push('/models/building_model/build_Alsop.gltf',5,5,5,50,3,15)
modelsMessage.push('/models/building_model/build_EEE.gltf',5,5,5,25,10,-25)
modelsMessage.push('/models/building_model/build_FB.gltf',5,5,5,-35,10,15)
modelsMessage.push('/models/building_model/build_Guild.gltf',5,5,5,10,10,20)
modelsMessage.push('/models/building_model/build_Victoria.gltf',5,5,5,-40,10,-25)

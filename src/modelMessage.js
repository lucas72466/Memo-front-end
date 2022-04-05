//.push()添加至末尾 .pop()删除末尾 .unshift()添加至开头 .splice()切片
//mouelMessage[路径，长，宽，高，X，Y，Z]
export var modelsMessage = []
export var characterMessage = {}
export var characterMessage2 = []

//非建筑物体
modelsMessage.push('/models/cctv/CCTV.gltf',0.5,0.5,0.5,-3,1,-14)
modelsMessage.push('/models/test/column.gltf',0.3,0.3,0.3,-6,2,4)
modelsMessage.push('/models/test/notice-board.gltf',0.3,0.3,0.3,1,0.4,21)
modelsMessage.push('/models/test/rubbish-bin.gltf',0.3,0.3,0.3,2,1.5,-13)

//二级跳出的三个物体先放入地下
modelsMessage.push('/models/test/book.gltf',1.5,1.5,1.5,5,-5,-5)
modelsMessage.push('/models/test/pencil.gltf',1,1,1,5,-5,-5)
modelsMessage.push('/models/test/star.gltf',2,2,2,5,-5,-6)

//主建筑物体
modelsMessage.push('/models/building_model/base.gltf',5,5,5,0,0,0)
modelsMessage.push('/models/building_model/build_Alsop.gltf',5,5,5,50,3,15)
modelsMessage.push('/models/building_model/build_EEE.gltf',5,5,5,25,10,-25)
modelsMessage.push('/models/building_model/build_FB.gltf',5,5,5,-35,10,15)
modelsMessage.push('/models/building_model/build_Guild.gltf',5,5,5,10,10,20)
modelsMessage.push('/models/building_model/build_Victoria.gltf',5,5,5,-40,10,-25)

//其他测试建筑物体
modelsMessage.push('/models/test/Museum stand-up sign.glb',2,2,2,5,3,-6)

characterMessage['base'] = '/models/character/base.gltf'
characterMessage['elf'] = '/models/character/elf.gltf'
characterMessage['goblin'] = '/models/character/goblin.gltf'
characterMessage['kimono'] = '/models/character/kimono.gltf'
characterMessage['knight'] = '/models/character/knight.gltf'
characterMessage['pug'] = '/models/character/pug.gltf'
characterMessage['viking'] = '/models/character/viking.gltf'
characterMessage['witch'] = '/models/character/witch.gltf'
characterMessage['zombie'] = '/models/character/zombie.gltf'
characterMessage['cow'] = '/models/character/Cow.gltf'

import * as THREE from 'three'

function onIntersect(testObject, objectsToTest, contactSurface) {
    // 物体中心点坐标
    const centerCoord = testObject.position.clone()
    // 获取网格中 几何对象的顶点对象
    //const position = testObject.geometry.attributes.position
    // 顶点三维向量
    const vertices = []
    // .count 矢量个数
    for (let i = 0; i < 6; i++) {
      // .getX() 获取给定索引的矢量的第一维元素
      //vertices.push(new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i)))
      //顺序是前后左右上下, temp是碰撞距离检测
      const temp =  0.8
      vertices.push(new THREE.Vector3(0, 0,  temp)),
      vertices.push(new THREE.Vector3(0, 0, -temp)),
      vertices.push(new THREE.Vector3( temp, 0, 0)),
      vertices.push(new THREE.Vector3(-temp, 0, 0)),
      vertices.push(new THREE.Vector3(0,  temp, 0)),
      vertices.push(new THREE.Vector3(0, -temp, 0))
    }
    for (let i = 0; i < vertices.length; i++) {
      // .matrixWorld 物体的世界坐标变换 -- 物体旋转、位移 的四维矩阵
      // .applyMatrix4() 将该向量乘以四阶矩阵
      // 获取世界坐标下 网格变换后的坐标
      let vertexWorldCoord = vertices[i].clone().applyMatrix4(testObject.matrixWorld)

      // .sub(x) 从该向量减去x向量
      // 获得由中心指向顶点的向量
      var dir = vertexWorldCoord.clone().sub(centerCoord)

      // .normalize() 将该向量转换为单位向量
      // 发射光线 centerCoord 为投射的原点向量  dir 向射线提供方向的方向向量
      let raycaster = new THREE.Raycaster(centerCoord, dir.clone().normalize())

      // 放入要检测的 物体cube2，返回相交物体
      let intersects = raycaster.intersectObjects(objectsToTest, true)

      if (intersects.length > 0) {
        // intersects[0].distance：射线起点与交叉点之间的距离(交叉点：射线和模型表面交叉点坐标)
        // dir.length()：几何体顶点和几何体中心构成向量的长度
        // intersects[0].distance小于dir.length() 表示物体相交
        if (intersects[0].distance < dir.length()) {
          if(i == 0)
          contactSurface = 0
          if(i == 1)
          contactSurface = 1
          if(i == 2)
          contactSurface = 2
          if(i == 3)
          contactSurface = 3
          if(i == 4)
          contactSurface = 4
          if(i == 5)
          contactSurface = 5
        }
      }
    }
  }

//另外一个碰撞检测方法
export function isCrashed() {
    //获取到底部cube的中心点坐标
    var originPoint = sphereR.position.clone();
    for(var vertexIndex = 0; vertexIndex < sphereR.geometry.vertices.length; vertexIndex++){
        //顶点原始坐标
        var localVertex = sphereR.geometry.vertices[vertexIndex].clone();
        //顶点经过变换后的坐标
        var globaVertex = localVertex.applyMatrix4(sphereR.matrix);
        //获得由中心指向顶点的向量
        var directionVector = globaVertex.sub(sphereR.position);
        //将方向向量初始化
        var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
        //检测射线与多个物体相交的情况
        var collisionResults = ray.intersectObjects([sphereL]);
        //如果返回结果不为空，且交点与射线起点的距离小于物体中心至顶点的距离，则发生碰撞
        if(collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() + 1.2 ){
            return true
        }
    }
    return false
}
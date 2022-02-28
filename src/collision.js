import * as THREE from 'three'

export function onIntersect(testObject, objectsToTest) {
    // 声明一个变量用来表示是否碰撞
    let bool = false

    // .position 对象局部位置
    // .clone() 复制一个新的三维向量
    // 网格中心 世界坐标
    const centerCoord = testObject.position.clone()
    // 获取网格中 几何对象的顶点对象
    const position = testObject.geometry.attributes.position
    // 顶点三维向量
    const vertices = []
    // .count 矢量个数
    for (let i = 0; i < position.count; i++) {
      // .getX() 获取给定索引的矢量的第一维元素
      vertices.push(new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i)))
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
          bool = true
        }
      }
    }
    return bool
  }
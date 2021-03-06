import {Polygon} from './Polygon'

/**
 * @author - Isuru Kusumal Rajapakse (xxfast)
 * @description - Represents an Circle shape
*/
export class Circle extends Polygon {
  constructor(color={fill:false,stroke:false},x=0,y=0,r=0,step=1) {
    super(pathFromCircle(x,y,r,step),color);
  }
}

function pathFromCircle(x,y,r,step){
  var path = [];
  var theta=1;
  while(theta<360){
    path.push({x: x + r * Math.cos((theta * Math.PI)/180),
               y: y + r * Math.sin((theta * Math.PI)/180)});
    theta+=step;
  }
  return path;
}

import {Component} from '../../core/components/Component'

/**
 * @author - Isuru Kusumal Rajapakse (xxfast)
 * @description - Represents a component that defines a collidable behaviors like collideon, bounds etc.
*/
export class CollidableSprite extends Component{
  constructor(owner) {
    super(owner);
    this.vertices = [];
    this.bounderies = {};
    this.collider = null;
    this.mass = 1;
  }

  /**
    * sets the weight of the sprite
    *   @param {int} x - weight to set.
    *   @returns {Sprite} itself
  */
  weight(w){
    this.mass = w;
    return this;
  }

  /**
    * calculate the bounds object of the this sprite
    * @returns {Object} bounds - bounds object formated as {top:,right:,down:,left:}.
  */
  bounds(){
    this.vertices = [{x:0, y:0},{x:+this.scale.width, y:0},
                   {x:+this.scale.width, y:+this.scale.height},{x:0, y:0+this.scale.height}];
    var rads = -(this.rotation * Math.PI)/180;
    for (var i=0;i < this.vertices.length;i++) {
     var dx = this.vertices[i].x - this.origin.x;
     var dy = this.vertices[i].y - this.origin.y;
     this.vertices[i].x = (dx * Math.cos(rads) - dy * Math.sin(rads))+ this.origin.x;
     this.vertices[i].y = (dx * Math.sin(rads) + dy * Math.cos(rads))+ this.origin.y;
    }
    var minx=this.vertices[0].x, miny=this.vertices[0].y;
    var maxx=this.vertices[0].x, maxy=this.vertices[0].y;
    for(var i=0;i<this.vertices.length;i++){
      if(this.vertices[i].x<minx) minx = this.vertices[i].x;
      if(this.vertices[i].y<miny) miny = this.vertices[i].y;
      if(this.vertices[i].x>maxx) maxx = this.vertices[i].x;
      if(this.vertices[i].y>maxy) maxy = this.vertices[i].y;
    }
    return {top:miny,right:maxx,down:maxy,left:minx};
  }

  /**
    * Sees if one game object is within another sprite
    * @param {GameObject} obj - GameObject to see if this is within.
  */
  within(obj){
    if(this.rotation == 0 && obj.rotation == 0){
      if ((this.position.x > (obj.position.x+obj.scale.width)) ||( obj.position.x > (this.position.x+ this.scale.width)))
          return false;
      if ((this.position.y > (obj.position.y+obj.scale.height)) ||( obj.position.y > (this.position.y+ this.scale.height)))
          return false;
    }
    return true;
  }

  /**
    * sets the custom collision mask for the current, or provided state of the sprite
    * @param {String} mask - url of the mask to set.
    * @param {State} state - the state of which the collider applies to.
    *   @returns {Sprite} itself
  */
  collideon(mask,state=this.state()){
    var image = new Image();
    image.src = mask;
    state.collider = image;
    return this;
  }

  /**
    * get the collision mask of the sprite
    *   @returns {Sprite} itself
  */
  mask(){
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var img = this.state().collider;
    //context.save();
    //context.translate(this.position.x+this.origin.x,this.position.y+this.origin.y);
    //context.rotate(-this.rotation * Math.PI/180);
    //context.translate(-this.position.x-this.origin.x, -this.position.y-this.origin.y);
    context.drawImage(img, 0, 0, this.scale.width, this.scale.height);
    return context.getImageData(0, 0, this.scale.width,  this.scale.height);
  }


  /**
   *  @param {string} sprite - Sprite object this object colliding with.
   *  @returns {bool} colliding
   */
  colliding(sprite){
      // we need to avoid using floats, as were doing array lookups
      var x  = Math.round( this.position.x ),
          y  = Math.round( this.position.y ),
          x2 = Math.round( sprite.position.x ),
          y2 = Math.round( sprite.position.y );


      var w  = this.scale.width,
          h  = this.scale.height,
          w2 = sprite.scale.width,
          h2 = sprite.scale.height ;

      var rads = this.rotation * Math.PI/180;
      var c = Math.abs(Math.cos(rads));
      var s = Math.abs(Math.sin(rads));
      w =  h * s + w * c;
      h = h * c + w * s ;
      w2 =  h2 * s + w2 * c;
      h2 = h2 * c + w2 * s ;

       w  = this.scale.width,
          h  = this.scale.height,
          w2 = sprite.scale.width,
          h2 = sprite.scale.height ;
      // find the top left and bottom right corners of overlapping area
      var xMin = Math.max( x, x2 ),
          yMin = Math.max( y, y2 ),
          xMax = Math.min( x+w, x2+w2 ),
          yMax = Math.min( y+h, y2+h2 );

      // Sanity collision check, we ensure that the top-left corner is both
      // above and to the left of the bottom-right corner.
      if ( xMin >= xMax || yMin >= yMax ) {
          return false;
      }

      var xDiff = xMax - xMin,
          yDiff = yMax - yMin;

      // get the pixels out from the images
      var pixels  = this.mask().data,
      pixels2 = sprite.mask().data;

      // if the area is really small,
      // then just perform a normal image collision check
      if ( xDiff < 4 && yDiff < 4 ) {
          for ( var pixelX = xMin; pixelX < xMax; pixelX++ ) {
              for ( var pixelY = yMin; pixelY < yMax; pixelY++ ) {
                  if (
                          ( pixels [ ((pixelX-x ) + (pixelY-y )*w )*4 + 3 ] !== 0 ) &&
                          ( pixels2[ ((pixelX-x2) + (pixelY-y2)*w2)*4 + 3 ] !== 0 )
                  ) {
                      return true;
                  }
              }
          }
      } else {
          /* What is this doing?
           * It is iterating over the overlapping area,
           * across the x then y the,
           * checking if the pixels are on top of this.
           *
           * What is special is that it increments by incX or incY,
           * allowing it to quickly jump across the image in large increments
           * rather then slowly going pixel by pixel.
           *
           * This makes it more likely to find a colliding pixel early.
           */

          // Work out the increments,
          // it's a third, but ensure we don't get a tiny
          // slither of an area for the last iteration (using fast ceil).
          var incX = xDiff / 3.0,
              incY = yDiff / 3.0;
          incX = (~~incX === incX) ? incX : (incX+1 | 0);
          incY = (~~incY === incY) ? incY : (incY+1 | 0);

          for ( var offsetY = 0; offsetY < incY; offsetY++ ) {
              for ( var offsetX = 0; offsetX < incX; offsetX++ ) {
                  for ( var pixelY = yMin+offsetY; pixelY < yMax; pixelY += incY ) {
                      for ( var pixelX = xMin+offsetX; pixelX < xMax; pixelX += incX ) {
                          if (
                                  ( pixels [ ((pixelX-x ) + (pixelY-y )*w )*4 + 3 ] !== 0 ) &&
                                  ( pixels2[ ((pixelX-x2) + (pixelY-y2)*w2)*4 + 3 ] !== 0 )
                          ) {
                              return true;
                          }
                      }
                  }
              }
          }
      }

      return false;
  }

  



}

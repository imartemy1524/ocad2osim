Array.prototype.last = function () {
    return this[this.length-1];
};
/***
 * @abstract
 */
class Figure{
    maxTop;
    maxBottom;
    maxLeft;
    maxRight;
    /**@abstract*/
    contains(x, y){
        throw `class ${this.constructor.name} does not implement abstract method ${this.contains.name}`;
    }
    /**@abstract
     * @return*/
    closestPoint(x, y){
        throw `class ${this.constructor.name} does not implement abstract method ${this.closestPoint.name}`
    }
    /**@abstract
     * @return {number}
     * */
    get area(){ throw `class ${this.constructor.name} does not implement abstract get method area`; }
    get width(){ throw `class ${this.constructor.name} does not implement abstract get method width`}
    get height(){ throw `class ${this.constructor.name} does not implement abstract get method height`}
}
class Rect extends Figure{

    /**
     *
     * @param maxTop {number}
     * @param maxBottom {number}
     * @param maxLeft {number}
     * @param maxRight {number}
     */
    constructor(maxTop=-1e10, maxBottom=1e10, maxLeft=1e10, maxRight=-1e10) {
        super();
        this.maxTop = maxTop;
        this.maxBottom = maxBottom;
        this.maxLeft = maxLeft;
        this.maxRight = maxRight;
    }
    asPolygon(){
        return [
            [this.maxLeft, this.maxBottom],
            [this.maxRight, this.maxBottom],
            [this.maxRight, this.maxTop],
            [this.maxLeft, this.maxTop],
        ]
    }
    static fromObjects(objects){
        const ans = new Rect();
        for(let obj of objects){
            for(let coord of obj.coordinates){
                let [x,y] = coord;
                if(x < ans.maxLeft) ans.maxLeft = x;
                if(x > ans.maxRight) ans.maxRight = x;
                if(y > ans.maxTop) ans.maxTop = y;
                if(y < ans.maxBottom) ans.maxBottom = y;
            }
        }
        return ans;
    }
    get width(){
        return this.maxRight - this.maxLeft;
    }
    get height(){
        return this.maxTop - this.maxBottom;
    }
    get area(){
        return this.width * this.height;
    }
    contains(x, y=undefined){
        if(typeof y == "undefined")[x,y] = x;
        return y > this.maxBottom && y < this.maxTop && x > this.maxLeft && x < this.maxRight;
    }
    closestPoint(x, y) {
        if(typeof y == "undefined")[x,y] = x;
        const values = [
            y - this.maxBottom,
            this.maxTop - y,
            x - this.maxLeft,
            this.maxRight - x
        ], min = Math.min(...values);
        switch (min) {
            case values[0]: return {pos: [x, this.maxBottom - this.height * 2], type: 'bottom'};
            case values[1]: return {pos: [x, this.maxTop + this.height * 2], type: 'top'};
            case values[2]: return {pos: [this.maxLeft - this.width * 2, y], type: 'left'};
            default: return {pos: [this.maxRight + this.width * 2, y], type: 'right'};
        }
    }

    xPercAt(x){
        return this.width * x + this.maxLeft;
    }
    yPercAt(y){
        return this.height * y + this.maxBottom;
    }
    xToPercent(x){
        return (x - this.maxLeft) / this.width;
    }
    yToPercent(y){
        return (y - this.maxBottom) / this.height;
    }
}

// try{
//     module.exports = {Figure:Figure, Rect: Rect}
// } catch (e) {
// }
export {Figure, Rect};
// module.exports = {
//     Figure: Figure,
//     Rect: Rect
// };
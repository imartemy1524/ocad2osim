'use strict';
import {ClipperLib} from "../tools/clipper.js";
window.ClipperLib = ClipperLib;
class Horizontals{
    /**
     *
     * @param coordinates {Number[][]}
     */
    constructor(coordinates) {
        this.coordinates = coordinates;
    }

    xAt(index){ return this.coordinates[index][0]; }
    yAt(index){ return this.coordinates[index][1]; }

}
class LayerDrawer{
    get rect(){ return this.map.rect; }
    get horizontals(){ return this.map.horizontals; }
    get berkShtricks(){ return this.map.berkShrtickhs; }
    /**
     *
     * @param map {MyMap}
     * @param canvas {HTMLCanvasElement}
     * @constructor
     */
    constructor(map, canvas = null) {
        this.multiplier = 0.3;
        this.canvas = canvas;
        this.canvas.width = map.rect.width * this.multiplier;
        this.canvas.height = map.rect.height * this.multiplier;
        this.ctx = this.canvas.getContext('2d');
        this.map = map;
    }
    _toCanvasPixelX(x){
        x = typeof x != "number" ? x[0] : x;
        return (x - this.rect.maxLeft ) * this.multiplier;
    }
    _toCanvasPixelY(y){
        y = typeof y != "number"? y[1] : y;
        return this.canvas.height-(y - this.rect.maxBottom) * this.multiplier; // ( - y + this.rect.height) * this.multiplier;
    }
    static getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    clear(){
        this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
    }
    /**
     *
     * @param index {Number} index to draw with another color
     */
    drawHorizontals(index=-1) {

        for(let i=0;i<this.horizontals.length;i++){
            this.ctx.beginPath();
            const coordinates = this.horizontals[i].coordinates;
            for(let j=1;j<coordinates.length;j++) {
                this.ctx.moveTo(this._toCanvasPixelX(coordinates[j-1]), this._toCanvasPixelY(coordinates[j-1]));
                this.ctx.lineTo(this._toCanvasPixelX(coordinates[j]), this._toCanvasPixelY(coordinates[j][1]))
            }
            this.ctx.closePath();
            this.ctx.strokeStyle = index === i ?"#45220e" :"#452e21";
            this.ctx.lineWidth = index === i ? 10: 5;
            this.ctx.stroke();
        }
        this.ctx.closePath();

    }
    fillHorizontal(){

    }

    /**
     *
     * @param berks {BerkShtrick[]}
     */
    drawBerkShtricks(berks=[]){
        for(let i=0;i<this.berkShtricks.length;i++){
            let position = this.berkShtricks[i].coordinates[0];
            let angle = this.berkShtricks[i].ang / 10;
            const lengthBerk = 50;
            let deltaAngleX = Math.sin(angle * Math.PI / 180) * lengthBerk, deltaAngleY =Math.cos(angle * Math.PI / 180 + Math.PI) * lengthBerk;
            let toPoxitionX = position[0],
                toPositionY = position[1],
                fromPositionX = position[0] - deltaAngleX,
                fromPositionY = position[1] - deltaAngleY;

            this.ctx.beginPath();
            this.ctx.moveTo(this._toCanvasPixelX(fromPositionX), this._toCanvasPixelY(fromPositionY));
            this.ctx.lineTo(this._toCanvasPixelX(toPoxitionX), this._toCanvasPixelY(toPositionY));
            this.ctx.closePath();
            const isPrime = berks.includes(position);
            this.ctx.strokeStyle = isPrime ?"#45220e" :"#452e21";
            this.ctx.lineWidth = isPrime ? 10: 5;
            this.ctx.stroke();
        }
    }

}
class HorizontalJoiner{
    /**
     *
     * @param figure {Figure}
     * @param horizontals {Object[]}
     * @param distance
     * @constructor
     */
    constructor(figure, horizontals, distance = 20){
        this.figure = figure;
        this.horizontals = horizontals;
        this.distance = distance;
        this.coordinates = this.horizontals.map((v, index)=>this._getCoordAtIndex(index));
    }

    /**
     *
     * @param coord {[number[], number[]]}
     * @param i {number}
     */
    _findNearest(coord, i) {
        if(this._equals(coord[0], coord[1]))return false;
        for(let j=i+1;j<this.coordinates.length;j++){
            let c = this.coordinates[j];
            if(!c)continue;
            if(this._equals(coord[0], c[0]))
                this._joinPart(i, j, true, true);
            else if(this._equals(coord.last(), c.last()))
                this._joinPart(i, j, false, false);
            else if(this._equals(coord.last(), c[0]))
                this._joinPart(i,j,false, true);
            else if(this._equals(coord[0], c.last()))
                this._joinPart(i,j,true, false);
            else continue;
            return true;
        }
        return false;
    }

    /**
     *
     * @param index_a {number}
     * @param index_b {number}
     * @param is_fist_a {boolean}
     * @param is_first_b {boolean}
     * @private
     */
    _joinPart(index_a, index_b, is_fist_a, is_first_b){
        if(index_b < index_a) [index_a, index_b] = [index_b, index_a];
        this.coordinates.splice(index_b, 1);
        let old_horiontal = this.horizontals.splice(index_b, 1)[0],
            new_horizontal = this.horizontals[index_a];
        if(is_fist_a){
            let appendThing = is_first_b?old_horiontal.coordinates.reverse() : old_horiontal.coordinates;
            appendThing.push(...new_horizontal.coordinates);
            new_horizontal.coordinates = appendThing;
        }
        else{
            let appendThing = is_first_b ? old_horiontal.coordinates : old_horiontal.coordinates.reverse();
            new_horizontal.coordinates.push(...appendThing);
        }
        this.coordinates[index_a] = this._getCoordAtIndex(index_a);
    }
    joinIt(){
        for (let i=0;i<this.coordinates.length;++i){
            const coord = this.coordinates[i];
            if(this._findNearest(coord, i)) --i;
        }
        this._moveHorizontalsToTheEndOfTheMap();
    }

    /**
     *
     * @param index {number}
     * @returns {Array|undefined}
     */
    _getCoordAtIndex(index){
        const coord = this.horizontals[index].coordinates;
        if(coord.length >= 2)
            return [coord[0], coord.last()];
    }
    _equals(first, second){
        return (first[0] - second[0]) ** 2 + (second[1] - first[1]) ** 2 < this.distance * this.distance;
    }

    _moveHorizontalsToTheEndOfTheMap() {
        const addFromType = (type)=> {
            switch (type) {
                case "bottom":
                case "top":
                    return [this.figure.maxRight + this.figure.width * 1.5, (this.figure.maxTop + this.figure.maxBottom)/2];
                case "left":
                case "right":
                    return  [(this.figure.maxLeft + this.figure.maxRight)/2, this.figure.maxBottom - this.figure.height * 1.5];
            }
        };
        for (let horizontal of this.horizontals){
            const coordinates = horizontal.coordinates;
            if(coordinates.length < 2 || this._equals(coordinates[0], coordinates.last())) {
                continue;
            }
            if (this.figure.contains(coordinates[0])) {
                let {pos, type} = this.figure.closestPoint(coordinates[0]);
                coordinates.unshift(addFromType(type), pos);
            }
            if(this.figure.contains(coordinates.last())) {
                let {pos, type} = this.figure.closestPoint(coordinates.last());
                coordinates.push(pos, addFromType(type));
            }
            //Going on perimeter and adding corners

        }
    }
}
try {
    module.exports = {
        CanvasDrawer: LayerDrawer, HorizontalsJoiner: HorizontalJoiner
    };
} catch (e) {
}
export {LayerDrawer, HorizontalJoiner as HorizontalsJoiner};

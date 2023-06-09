import {GPU} from "../tools/gpu.js";
import {distance_to_poly} from "../tools/point-polygon-dist.js";

import {MessagePack} from "../tools/msgpack.js";
import {LayersDrawer} from "./layers-drawer.js";


export class MapBuilder {
    /**
     *
     * @param horizontals {OneHorizontal[]}
     * @param ocadFile
     * @param rect {Rect}
     * @param outSize {number} size of the map = power of 2  >= 512
     * @param map {MyMap}
     */
    constructor(horizontals, ocadFile,rect,  outSize, map) {
        if(![513,1025,2049, 4097].includes(outSize)) throw "Invalid map size! - size "+outSize+" != 2^n+1";
        this.horizontals = horizontals;
        this.ocadFile = ocadFile;
        this.rect = rect;
        this.outHeights = Array.from(new Array(outSize),()=>new Array(outSize));
        this.gpu = new GPU.GPU();
        this.size = outSize;
        this.maxHeight = 500;
        this.map = map;
    }
    build(){
        const th = this;

        /**
         *
         * @param inside_up {boolean[]}
         * @param polys {{X: number,Y: number}[]}
         * @param maxDistances {number[]}[]
         * @param size {number}
         * @param rect {Rect}
         */
        function kernelFunction(inside_up, polys,maxDistances, size, rect) {
            let y = this.thread.y, x = this.thread.x,
                yPerc = y / th.size, xPerc = x/th.size,
                realPoint = {X: rect.xPercAt(xPerc), Y: rect.yPercAt(yPerc)};
            let sum = 0;
            for(let i=0;i<inside_up.length;i++) {
                const inside = ClipperLib.Clipper.PointInPolygon(realPoint, polys[i]);

                if(inside !== 0 && inside_up[i] || inside ===0 && !inside_up[i]) { // if inside poly
                    let distanceToPoly = distance_to_poly([realPoint.X, realPoint.Y], th.horizontals[i].coordinates);
                    let perc = distanceToPoly / maxDistances[i];
                    perc = th.getYAtX(perc);
                    sum += 5 *  perc;

                }
                // else if(inside === 0 && !inside_up[i]){}

            }
            return sum;
        }
        // const matrix = this.gpu
        //     .createKernel(kernelFunction)
        //     .addFunction()
        //     .setOutput([this.outHeights, this.outHeights]);
        // const outArray = matrix(this.horizontals, this.size);
        const horizontals_up_down = this.horizontals.map(e=>e.insideUp),
            polys = this.horizontals.map(h=>h.coordinates.map(e=>({X:e[0], Y:e[1]}))),
            maxDistances = this.horizontals.map(h=>this.maxDistances(h));
        for(let x=0;x<this.size;x++)
        for(let y=0;y<this.size;y++){
            this.outHeights[x][y] = kernelFunction.call({thread:{x:x, y:y}}, horizontals_up_down, polys, maxDistances, this.size,this.rect);
            if(x%5===0 &&y===0)console.log(`x=${x}; y=${y}`)
        }
        this.visualizeArray(window['outHeights'] = this.outHeights);
    }
    getYAtX(x){
        const c = 1-(x>1?1:x);
        return Math.sqrt(1 - c*c);
    }
    atArray(array, x, y) {
        if(x<0)x=0;
        if(x>=this.size) x = this.size -1;
        if(y>=this.size) y = this.size -1;
        if(y<0) y = 0;
        return array[x][y];
    }
    visualizeArray(array){
        const canvas = document.getElementById('canvas');
        canvas.width = canvas.height = this.size;
        const ctx = canvas.getContext('2d');
        const arr = new Uint8ClampedArray(this.size * this.size << 2);

// Iterate through every pixel
        let newArray = array.map(arr=>arr.slice());
        for(let j=0;j<4;j++) {
            for (let x = 0; x < this.size; x++)
                for (let y = 0; y < this.size; y++) {
                    const value = (this.atArray(array, x, y) * 8
                        + this.atArray(array, x - 1, y) * 3
                        + this.atArray(array, x + 1, y) * 3
                        + this.atArray(array, x, y + 1) * 3
                        + this.atArray(array, x, y - 1) * 3
                        + this.atArray(array, x - 1, y - 1) * 2
                        + this.atArray(array, x - 1, y + 1) * 2
                        + this.atArray(array, x + 1, y + 1) * 2
                        + this.atArray(array, x + 1, y - 1) * 2
                        + this.atArray(array, x + 2, y)
                        + this.atArray(array, x - 2, y)
                        + this.atArray(array, x, y + 2)
                        + this.atArray(array, x, y - 2)
                    ) / (8 + 3 + 3 + 3 + 3 + 2 + 2 + 2 + 2 + 1 + 1 + 1 + 1);
                    newArray[x][y] = value;
                    if(j===3) {
                        const i = y * this.size + x;
                        arr[(i << 2) + 0] = value;    // R value
                        arr[(i << 2) + 1] = value;  // G value
                        arr[(i << 2) + 2] = value;    // B value
                        arr[(i << 2) + 3] = 255;  // A value
                    }
                }
            [newArray, array] = [array, newArray];
        }
        this.reliefData = newArray;
        const imageData = new ImageData(arr, this.size, this.size);

        // const ans = this.gpu
        //     .createKernel(function (data) {
        //         const x = Math.floor(this.thread.x / 4) % 1024,
        //             y = Math.floor(this.thread.y / 4) / 1024;
        //         function pixelAt(x, y) {
        //             if (x < 0) x = 0;
        //             if (y < 0) y = 0;
        //             if (x >= this.constants.w) x = this.constants.w - 1;
        //             if (y >= this.constants.h) y = this.constants.h - 1;
        //             return data[4 * (x + this.constants.w * (this.constants.h - y))];
        //         }
        //         const PIX0 = pixelAt(x, y);
        //         const PIX1 = pixelAt(x+1, y);
        //         const PIX2 = pixelAt( x-1, y);
        //         const PIX3 = pixelAt( x, y+1);
        //         const PIX4 = pixelAt( x, y-1);
        //         const sum = (PIX0 * 3 + PIX1+PIX2+PIX3+PIX4) / 7;
        //         return sum;
        //         // this.color(sum/256, sum/256, sum/256, 1);
        //     })
        //     .setConstants({ w: this.size, h: this.size })
        //     .setOutput([this.size * this.size * 4])
        //     (imageData.data);

        ctx.putImageData(imageData, 0, 0);

    }

    /**
     *
     * @param h {OneHorizontal}
     */
    maxDistances(h) {
        const distanceSqrt = (a,b) =>{
            const deltaX = a[0]-b[0],
                deltaY = a[1]-b[1];
            return deltaX*deltaX + deltaY*deltaY;
        };
        let maxDistanceSqrt = 0;
        for(let i=0;i<h.coordinates.length;i++)
        for(let j=i+1;j<h.coordinates.length;j++){
            let coordA = h.coordinates[i],
                coordB = h.coordinates[j],
                distanceS = distanceSqrt(coordA, coordB);
            if(distanceS > maxDistanceSqrt) maxDistanceSqrt = distanceS;
        }
        return Math.sqrt(maxDistanceSqrt) / 2;
    }
    get reliefDataUint8array(){
        // const view = new DataView(new ArrayBuffer(4 * this.size * this.size));
        // for(let x=0;x<this.size;x++)
        // for(let y=0;y<this.size;y++) {
        //     view.setFloat32(((y*1024 + x)<<2), this.reliefData[x][y] / 256);
        // }
        // return new Uint8Array(view.buffer);
        const ans = new Float32Array(this.size * this.size);
        let max = 0, min = 9999;
        for(let x=0;x<this.size;x++)
        for(let y=0;y<this.size;y++) {
            if(this.reliefData[x][y] > max) max = this.reliefData[x][y];
            if(this.reliefData[x][y] < min) min = this.reliefData[x][y];
        }
        for(let x=0;x<this.size;x++)
        for(let y=0;y<this.size;y++) {
            ans[y*this.size + x] = (this.reliefData[x][y] - (min - min%5) + 5) / this.maxHeight;
        }
        console.log(`MAX: ${max}, MIN: ${min}`);
        return ans;
        // const arr = [].concat(...this.reliefData);
        // return new Float32Array(arr.map(e => e / 256));
    }
    async save(){
        const toPosition  = coord=> {
            const x1 = this.rect.xToPercent(coord[0]),
                y1 = this.rect.yToPercent(coord[1]);
            if(x1 < 0 || x1 > 1 || y1<0 || y1>1) return [-1,-1];
            return [x1 * this.size, y1 * this.size]
        };
        const ans = {
            image: new ImageBytes(new Uint8Array(await $("#image-preview")[0].files[0].arrayBuffer())).toBytes(),
            width: this.size-1,
            height: this.size-1,
            rocks: [
                {position: [300.,300.], size:0},
                {position: [100.,410.], size:0},
                {position: [500.,240.], size:1},
                {position: [310.,40.], size:0},
                {position: [20., 140.], size:2},
                {position: [330.,440.], size:1},
            ],
            relief:{
                layersTexture: new ImageBytes(this.createLayersTexture()).toBytes(),
                pits: [
                    ...this.map.pits.map(e=>({position: toPosition(e.coordinates[0]), size: 2})).filter(e=>e.position[0]!==-1),
                    ...this.map.pits.map(e=>({position: toPosition(e.coordinates[0]), size: 1})).filter(e=>e.position[0]!==-1),
                ],
                hillocks: this.map.hilloks.map(e=>toPosition(e.coordinates[0])).filter(e=>e[0]!==-1),
                ditches: [],
                reliefData: [this.size, this.size, this.reliefDataUint8array],
                waterHeight: 0,
                waterHeightPerc: 0,
            },
            roads: [],
            differentObjects: {
                wells: []
            },
            objectsSettings:{
                forestType: 0,
                contourInterval: 5.
            },
        };
        return MessagePack.encode(ans)
    }

    createLayersTexture() {
        const canvas = document.createElement("canvas");
        canvas.width = this.size;
        canvas.height = this.size;
        new LayersDrawer(canvas, this.map).draw();
        const url = canvas.toDataURL("image/png").split(',',2)[1];
        return Uint8Array.from(atob(url), c => c.charCodeAt(0));

    }
}

class ImageBytes{
    /**
     *
     * @param imageBytes {Uint8Array}
     */
    constructor(imageBytes) {
        this.imageBytes = imageBytes;
    }

    toBytes(){
        let length = BitConverter.GetBytes(this.imageBytes.length);
        return concatArrays(length, this.imageBytes);
    }
}
const BitConverter = {
    GetBytes(int) {
        const b = new Uint8Array(4);
        b[0] = int;
        b[1] = int >> 8;
        b[2] = int >> 16;
        b[3] = int >> 24;
        return b
    },
    /**
     * @return {number}
     */
    ToInt(buffer) {
        return (buffer[0] | buffer[1]<<8 | buffer[2] << 16 | buffer[3] << 24);
    }
};

function concatArrays(...arrays) {
    let length = 0;
    arrays.forEach(item => { length += item.length;});

    let mergedArray = new Uint8Array(length);
    let offset = 0;
    arrays.forEach(item => {
        mergedArray.set(item, offset);
        offset += item.length;
    });

    return mergedArray;
}
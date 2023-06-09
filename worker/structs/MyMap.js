import {Rect} from "../structs.js";
import {HorizontalsJoiner} from "../worker.js";
/***
 *
 * @property horizontals {OneHorizontal[]}
 */

class MyMap {
    constructor(ocadFile) {
        this.ocadFile = ocadFile;
        /**@type {OneHorizontal[]}*/this.horizontals = [];
        /**@type {BerkShtrick[]}*/this.berkShrtickhs = [];
        /**@type {OneElement[]}*/this.greenVeryHardToRun = [];
        /**@type {OneElement[]}*/this.greenHardToRun = [];
        /**@type {OneElement[]}*/this.greenEasyToRun = [];
        /**@type {OneElement[]}*/this.glades = [];
        /**@type {OneElement[]}*/this.pits = [];
        /**@type {OneElement[]}*/this.pitsSmall = [];
        /**@type {OneElement[]}*/this.hilloks = [];
        /**@type {Rect}*/ this.rect = null;

    }

    /**
     * @return {MyMap}
     */
    parse(){
        const file = this.ocadFile;
        // const horizontalNums = file.symbols.filter(e=>['101.0', '102.0', '106.0'].includes(e.number)).map(e=>e.symNum),
        //     berkShtrickhsNum = file.symbols.find(e=>e.number === '104.0').symNum;
        // this.horizontals = file.objects.filter(e=>horizontalNums.includes(e.sym));
        // this.berkShrtickhs = file.objects.filter(e=>e.sym === berkShtrickhsNum);
        this.horizontals = this.objectOfNumber('101.0', '102.0', '106.0');
        this.berkShrtickhs = this.objectOfNumber('104.0');
        this.glades = this.objectOfNumber('401.0');
        this.greenVeryHardToRun = this.objectOfNumber('410.0');
        this.greenHardToRun = this.objectOfNumber('408.0');
        this.greenEasyToRun = this.objectOfNumber('406.0');
        this.pits = this.objectOfNumber('116.0');
        this.pitsSmall = this.objectOfNumber('115.0');
        this.hilloks = this.objectOfNumber('112.0');
        this.rect = Rect.fromObjects(file.objects);
        new HorizontalsJoiner(this.rect, this.horizontals).joinIt();
        return this;
    }
    objectOfNumber(...numbers){
        const symNums = this.ocadFile.symbols.filter(e=>numbers.includes(e.number)).map(e=>e.symNum);
        return this.ocadFile.objects.filter(e=>symNums.includes(e.sym));
    }
    filterHorizontals(){
        for (let i=0;i<this.horizontals.length;i++) {
            if (!this.horizontals[i].coordinates.some(coord => this.rect.contains(coord))) {
                this.horizontals.splice(i--, 1);
            }
        }
    }

}


export {MyMap};
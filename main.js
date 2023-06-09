"use strict";
import {OcadModule, Buffer} from './ocadtogeojson.js';
import {Rect} from "./worker/structs.js";
import {$} from "./tools/jquery.js"
import {AskWorker} from "./worker/ask-height-worker.js";
import {LayerDrawer, HorizontalsJoiner} from "./worker/worker.js";
import {GPU} from "./tools/gpu.js";
import {MapBuilder} from "./worker/map-builder.js";
import {MyMap} from "./worker/structs/MyMap.js";
// readOcad("C:\\Users\\imart\\Downloads\\20210105_744.ocd").then(ParseOcadFile);

class MainWorker{
    // static ParseOcadFile(file) {
    //     const horizontalNums = file.symbols.filter(e=>['101.0', '106.0'].includes(e.number)).map(e=>e.symNum),
    //         berkShtrickhsNum = file.symbols.find(e=>e.number === '104.0').symNum;
    //     const horizontals = file.objects.filter(e=>horizontalNums.includes(e.sym)),
    //         berkShtrickhs = file.objects.filter(e=>e.sym === berkShtrickhsNum);
    //     const rect = Rect.fromObjects(file.objects);
    //     new HorizontalsJoiner(rect, horizontals).joinIt();
    //     return {rect, horizontals, berkShtrickhs};
    // }

    constructor(ocadFile) {
        this.ocadFile = ocadFile;
        this.myMap = new MyMap(ocadFile).parse();
        // let {rect, horizontals, berkShtrickhs} = MainWorker.ParseOcadFile(this.ocadFile);
        // this.berkShtricks = berkShtrickhs;
        // this.rect = rect;
        // this.horizontals = horizontals;
        /**@type {HTMLCanvasElement}*/this.canvas = $("#canvas")[0];
        this.drawer = new LayerDrawer(this.myMap, this.canvas);
    }
    _update_drawer(){
        this.drawer.canvas.width = this.myMap.rect.width * this.drawer.multiplier;
        this.drawer.canvas.height = this.myMap.rect.height * this.drawer.multiplier;
    }
    async start(){
        this.drawer.drawHorizontals();
        this.drawer.drawBerkShtricks();
        this.myMap.rect = await this.createRect();
        this.myMap.filterHorizontals();
        this._update_drawer();
        this.drawer.drawHorizontals();
        this.drawer.drawBerkShtricks();

        $("#help-tips").html("<div>Press \"1\" if <b style='color: rgba(185,178,255,0.7)'>pink</b> is higher.<br>" +
            "Press \"2\" if <b style='color: rgba(89,255,170,0.78)'>green</b> is higher.<br></div>");
        for(let i=0;i<this.myMap.horizontals.length;i++) {
            await this.workWithHorizontal(this.myMap.horizontals[i], i);
        }
        await this.buildMap();
    }
    buildMap(){
        const builder = new MapBuilder(this.myMap.horizontals, this.ocadFile, this.myMap.rect, 513, this.myMap);
        builder.build();  //TODO: add choice size
        builder.save().then(uint8Data=> {
            const saveByteArray = (function () {
                const a = document.createElement("a");
                document.body.appendChild(a);
                a.style.display = "none";
                return function (data, name) {
                    const blob = new Blob(data, {type: "octet/stream"}),
                        url = window.URL.createObjectURL(blob);
                    a.href = url;
                    a.download = name;
                    a.click();
                    window.URL.revokeObjectURL(url);
                };
            }());
            saveByteArray([uint8Data], "o-map.osim")

        } );
    }
    createRect(){
        $("#help-tips").html("Choice map area.<br>Move mouse to move rect. To scale use scroll<br> To save - press enter or mouse down");
        let mover = $("<div id='mover'></div>").appendTo($("body"));
        let size = Math.min(this.canvas.offsetWidth, this.canvas.offsetHeight);
        const mousemove = (e) => {
            if(!e)e = mousemove.laste;
            else{
                e.originalEvent.preventDefault();
            }
            mover.css("left", Math.max(Math.min(e.pageX - size/2, this.canvas.offsetWidth - size), 0));
            mover.css("top", Math.max(Math.min(e.pageY - size/2, this.canvas.offsetHeight - size), 0));
            mousemove.laste = e;
        };
        function onWheel(e) {
            let delta = e.originalEvent.deltaY;
            if(delta > 0) {
                size *= .9;
            }
            else{
                size *= 1/0.9;
                size = Math.min(size, Math.min(this.canvas.offsetWidth, this.canvas.offsetHeight));
            }
            updateSize();
            mousemove();
            return false;
        }
        function updateSize(){
            mover.css("width", size);
            mover.css("height", size);
        }
        updateSize();
        $(window).on("mousemove", mousemove, ).on("wheel", onWheel);
        return new Promise(resolve => {
            const toX = x => this.myMap.rect.xPercAt(x / this.canvas.offsetWidth),
                toY = y => this.myMap.rect.yPercAt(1-y / this.canvas.offsetHeight);//this.canvas.height-(y/this.drawer.multiplier - this.rect.maxBottom);
            mover.on("click keypress", () => {
                const widthHeight = size;
                //coordinates of left top corner
                const left = parseInt(mover.css("left")),
                    top = parseInt(mover.css("top"));
                const rect = new Rect(toY(top), toY(top+widthHeight), toX(left), toX(left+widthHeight));
                $(window).off("mousemove", mousemove, ).off("wheel", onWheel);
                mover.remove();
                resolve(rect);
            })
        });
    }

    /**
     *
     * @param horizontal {OneHorizontal}
     * @param index
     * @return {Promise<void>}
     */
    async workWithHorizontal(horizontal, index){
        const worker = new AskWorker(horizontal.coordinates, this.myMap.berkShrtickhs);
        if(worker.berkshtricks.length){
            horizontal.insideUp = !(worker.berkshtricks[0].inside);
        }
        else {
            worker.ask(this.drawer, index);
            horizontal.insideUp = await this.waitForNextClick() === 1;
        }
    }
    waitForNextClick(){
        return new Promise(success=>$(window).on('keyup', function onKeyUp(e) {
            if(e.key === '1') success(1);
            else if(e.key === '2') success(2);
            else return;
            $(window).off('keyup', onKeyUp);
        }))
    }

}
$(function () {
    $("#ocad-input").on('change',async function () {
        if(this.files[0]) {
            let buffer = new Buffer(await this.files[0].arrayBuffer());
            let ocadFile = await OcadModule.readOcad(buffer);
            await new MainWorker(ocadFile).start();
        }
    })
});



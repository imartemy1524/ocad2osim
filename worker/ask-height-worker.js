import {LayerDrawer} from "./worker.js";
import {clipperMinus} from "./utlis.js";

export class AskWorker{
    constructor(polygonsArray, berkShtricks) {
        this.polygons = polygonsArray;//.map(e=>({X:e[0], Y: e[1]}));
        this.berkshtricks = this.findNearestBerkShtricks(berkShtricks);
    }

    /**
     *
     * @param canvasDrawer {LayerDrawer}
     * @param index {number}
     */
    ask(canvasDrawer, index){
        canvasDrawer.clear();
        canvasDrawer.drawHorizontals(index);
        canvasDrawer.drawBerkShtricks(this.berkshtricks);
        this.fillInsideOutside(canvasDrawer);
    }
    distance_to_poly(point, poly) {
        const dists = $.map(poly, (function(p1, i) {
            var prev = (i == 0 ? poly.length : i) - 1,
                p2 = poly[prev],
                line = vsub(p2, p1);

            if (vlen(line) == 0)
                return vlen(vsub(point, p1));

            var norm = vnorm(line),
                x1 = point[0],
                x2 = norm[0],
                x3 = p1[0],
                x4 = line[0],
                y1 = point[1],
                y2 = norm[1],
                y3 = p1[1],
                y4 = line[1],

                j = (x3 - x1 - x2 * y3 / y2 + x2 * y1 / y2) / (x2 * y4 / y2 - x4),
                i;

            if (j < 0 || j > 1)
                return Math.min(
                    vlen(vsub(point, p1)),
                    vlen(vsub(point, p2)));

            i = (y3 + j * y4 - y1) / y2;

            return vlen(vscale(norm, i));
        }));

        return Math.min(...dists);
    }

    /**
     *
     * @param berkShtricks {BerkShtrick[]}
     */
    findNearestBerkShtricks(berkShtricks) {
        const polyXY = this.polyXY();
        const ans = berkShtricks.map(berk => {
            let position = berk.coordinates[0];
            let angle = berk.ang / 10;
            const lengthBerk = 60;
            let deltaAngleX = Math.sin(angle * Math.PI / 180) * lengthBerk, deltaAngleY =Math.cos(angle * Math.PI / 180 + Math.PI) * lengthBerk;
            const toPoxitionX = position[0] + deltaAngleX,
                toPositionY = position[1] + deltaAngleY,
                fromPositionX = position[0] - deltaAngleX,
                fromPositionY = position[1] - deltaAngleY;
            const inPoly1 = ClipperLib.Clipper.PointInPolygon({X:toPoxitionX, Y:toPositionY}, polyXY),
                inPoly2 = ClipperLib.Clipper.PointInPolygon({X:fromPositionX, Y:fromPositionY}, polyXY);
            return {
                item: berk.coordinates[0],
                isValid: inPoly1 !== inPoly2,
                inside: inPoly2
            };
        }).filter(e=>e.isValid).map(e=>({0: e.item[0], 1: e.item[1], length:2, inside: e.inside}));
        return ans;
    }
    polyXY(){
        return this.polygons.map(e=>({X:e[0], Y:e[1]}));
    }
    /**
     *
     * @param canvasDrawer {LayerDrawer}
     */
    fillInsideOutside(canvasDrawer) {

        this.drawPolygon(canvasDrawer, canvasDrawer.rect.asPolygon(), "");
        this.drawPolygon(canvasDrawer, this.polygons, "rgba(89,255,170,0.78)", false);

        // canvasDrawer.ctx.fillRect(0,0,‌‌canvasDrawer.ctx.canvas.width,‌‌canvasDrawer.ctx.canvas.height);

        this.drawPolygon(canvasDrawer, this.polygons);

        // const out = clipperMinus(canvasDrawer.rect.asPolygon(), this.polygons);
        // this.drawPolygon(canvasDrawer, out, "rgba(78,225,255,0.56)")
    }
    drawPolygon(canvasDrawer, array, fillStyle = "rgba(185,178,255,0.7)", beginPath=true){
        if(beginPath) canvasDrawer.ctx.beginPath();
        canvasDrawer.ctx.moveTo(canvasDrawer._toCanvasPixelX(array[0]), canvasDrawer._toCanvasPixelY(array[0]));
        for(let i=1;i<array.length;i++){
            canvasDrawer.ctx.lineTo(canvasDrawer._toCanvasPixelX(array[i]), canvasDrawer._toCanvasPixelY(array[i]));
        }
        canvasDrawer.ctx.closePath();
        if (fillStyle) {
            canvasDrawer.ctx.fillStyle = fillStyle;
            canvasDrawer.ctx.fill();
        }

    }
}
function vlen(vector) {
    return Math.sqrt(vector[0]*vector[0] + vector[1] * vector[1]);
}

function vsub(v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1]];
}

function vscale(vector, factor) {
    return [vector[0] * factor, vector[1] * factor];
}

function vnorm(v) {
    return [-v[1], v[0]];
}

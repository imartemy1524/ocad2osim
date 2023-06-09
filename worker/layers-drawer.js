const DARK_GREEN = "rgba(158, 255, 139, 1)",
    GREEN = "rgba(217, 255, 209, 1)",
    SUPER_DARK_GREEN = "rgb(0,131,0)",
    GLADE_COLOR = "rgba(254, 192, 79)";
class LayersDrawer {
    /**
     *
     * @param canvas {HTMLCanvasElement}
     * @param myMap {MyMap}
     */
    constructor(canvas, myMap) {
        this.ctx = canvas.getContext("2d");
        this.ctx.fillStyle = "#fff";
        this.ctx.fillRect(0,0,canvas.width, canvas.height);
        this.map = myMap;
        this.width = canvas.width;
        this.height = canvas.height;
    }
    draw(){
        for (let glade of this.map.glades)
            this.fillPolygon(glade.coordinates, GLADE_COLOR);
        for(let green of this.map.greenEasyToRun)
            this.fillPolygon(green.coordinates, GREEN);
        for(let green of this.map.greenHardToRun)
            this.fillPolygon(green.coordinates, DARK_GREEN);
        for(let green of this.map.greenVeryHardToRun)
            this.fillPolygon(green.coordinates, SUPER_DARK_GREEN);
    }
    fillPolygon(coordinates, color){
        this.ctx.beginPath();
        this.ctx.moveTo(this.toCanvasX(coordinates[0][0]), this.toCanvasY(coordinates[0][0]));
        for(let i=1;i<coordinates.length;i++){
            this.ctx.lineTo(this.toCanvasX(coordinates[i][0]), this.toCanvasY(coordinates[i][1]));
        }
        this.ctx.lineTo(this.toCanvasX(coordinates[0][0]), this.toCanvasY(coordinates[0][0]));

        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }
    toCanvasX(x){
        return this.map.rect.xToPercent(x)*this.width;
    }
    toCanvasY(y){
        return this.map.rect.yToPercent(y)*this.height
    }
}

export {LayersDrawer};
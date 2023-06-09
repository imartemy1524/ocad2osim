/***
 *
 * @param polygonA {[number, number][]}
 * @param polygonMinus
 */
function clipperMinus(polygonA, polygonMinus) {
    let solution = new ClipperLib.Paths(),
        c = new ClipperLib.Clipper();
    c.AddPaths([polygonA.map(e=>({X:e[0], Y:e[1]}))], ClipperLib.PolyType.ptSubject, true);
    c.AddPaths([polygonMinus.map(e=>({X:e[0], Y:e[1]}))], ClipperLib.PolyType.ptClip, true);
    c.Execute(ClipperLib.ClipType.ctXor, solution);
    return solution[0].map(e=>[e.X,e.Y]);
}

export  {clipperMinus};
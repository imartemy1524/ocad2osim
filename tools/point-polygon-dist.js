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

function distance_to_poly(point, poly) {
    var dists = $.map(poly, function(p1, i) {
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
    });

    return Math.min.apply(null, dists.filter(e=>!isNaN(e)));
}
export {distance_to_poly}
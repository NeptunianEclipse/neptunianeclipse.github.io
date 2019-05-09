let TOLERANCE = 1e-9;
let BIG_FLOAT = 1e38;

class Context {

    constructor() {
        this.vertices = [];
        this.lines = [];
        this.edges = [];
        this.triangles = [];
        this.polygons = [];
    }

    outVertex(s) {
        this.vertices.push({x: s.x, y: s.y});
    }

    outTriple(s1, s2, s3) {
        this.triangles.push([s1.siteNum, s2.siteNum, s3.siteNum]);
    }

    outBisector(edge) {
        this.lines.push([edge.a, edge.b, edge.c]);
    }

    outEdge(edge) {
        let siteNumL = -1;
        if(edge.ep[Edge.LEFT_EDGE] != null) {
            siteNumL = edge.ep[Edge.LEFT_EDGE].siteNum;
        }
        let siteNumR = -1;
        if(edge.ep[Edge.RIGHT_EDGE] != null) {
            siteNumR = edge.ep[Edge.RIGHT_EDGE].siteNum;
        }
        if(this.polygons.includes(edge.reg[0].siteNum) == false) {
            this.polygons[edge.reg[0].siteNum] = [];
        }
        if(this.polygons.includes(edge.reg[1].siteNum) == false) {
            this.polygons[edge.reg[1].siteNum] = [];
        }

        this.polygons[edge.reg[0].siteNum].push([edge.edgeNum, siteNumL, siteNumR]);
        this.polygons[edge.reg[1].siteNum].push([edge.edgeNum, siteNumL, siteNumR]);
        this.edges.push([edge.edgeNum, siteNumL, siteNumR]);
    }

}

function computeVoronoiDiagram(points) {
    let siteList = new SiteList(points);
    let context = new Context();
    voronoi(siteList, context);
    return {
        vertices: context.vertices,
        lines: context.lines,
        edges: context.edges
    }
}

function voronoi(siteList, context) {
    let edgeList = new EdgeList(siteList.xMin, siteList.xMax, siteList.length());
    let priorityQ = new PriorityQueue(siteList.yMin, siteList.yMax, siteList.length());
    let siteIter = siteList[Symbol.iterator]();

    let bottomSite = siteIter.next();
    let newSite = siteIter.next();
    let minPt = new Site(-BIG_FLOAT, -BIG_FLOAT);
    
    while(true) {
        if(priorityQ.isEmpty() == false) {
            minPt = priorityQ.getMinPt();
        }

        if(newSite && (priorityQ.isEmpty() || cmp(newSite, minPt) < 0)) {
            let leftBound = edgeList.leftBound(newSite);
            let rightBound = leftBound.right;

            let bottom = leftBound.rightReg(bottomSite);
            let edge = Edge.bisect(bottom, newSite);
            context.outBisector(edge);

            let bisector = new HalfEdge(edge, Edge.LEFT_EDGE);
            edgeList.insert(leftBound, bisector);

            let p = leftBound.intersect(bisector);
            if(p != null) {
                priorityQ.delete(leftBound);
                priorityQ.insert(leftBound, p, newSite.distance(p));
            }

            leftBound = bisector;
            bisector = new HalfEdge(edge, Edge.RIGHT_EDGE);
            edgeList.insert(leftBound, bisector);

            p = bisector.intersect(rightBound);
            if(p != null) {
                priorityQ.insert(bisector, p, newSite.distance(p));
            }

            newSite = siteIter.next();
        } else if(priorityQ.isEmpty() == false) {
            let leftBound = priorityQ.popMinHalfEdge();
            let leftLeftBound = leftBound.left;
            let rightBound = leftBound.right;
            let rightRightBound = rightBound.right;

            let bottom = leftBound.leftReg(bottomSite);
            let top = rightBound.rightReg(bottomSite);

            let mid = leftBound.rightReg(bottomSite);
            context.outTriple(bottom, top, mid);

            let v = leftBound.vertex;
            siteList.setSiteNum(v);
            context.outVertex(v);

            if(leftBound.edge.setEndpoint(leftBound.pm, v)) {
                context.outEdge(leftBound.edge);
            }
            if(rightBound.edge.setEndpoint(rightBound.pm, v)) {
                context.outEdge(rightBound.edge);
            }

            edgeList.delete(leftBound);
            priorityQ.delete(rightBound);
            edgeList.delete(rightBound);

            pm = Edge.LEFT_EDGE;
            if(bottom.y > top.y) {
                let temp = bottom;
                bottom = top;
                top = temp;
                pm = Edge.RIGHT_EDGE;
            }

            edge = Edge.bisect(bottom, top);
            context.outBisector(edge);

            let bisector = new HalfEdge(edge, pm);

            edgeList.insert(leftLeftBound, bisector);
            if(edge.setEndpoint(Edge.RIGHT_EDGE - pm, v)) {
                context.outEdge(edge);
            }

            let p = leftLeftBound.intersect(bisector);
            if(p != null) {
                priorityQ.delete(leftLeftBound);
                priorityQ.insert(leftLeftBound, p, bottom.distance(p));
            }

            p = bisector.intersect(rightRightBound);
            if(p != null) {
                priorityQ.insert(bisector, p, bottom.distance(p));
            }

        } else {
            break;
        }
    }

    let he = edgeList.leftEnd.right;
    while(he != edgeList.rightEnd) {
        context.outEdge(he.edge);
        he = he.right;
    }
    Edge.EDGE_NUM = 0;
}

function isEqual(a, b, relativeError = TOLERANCE) {
    let norm = Math.max(Math.abs(a), Math.abs(b));
    return (norm < relativeError) || (Math.abs(a - b) < (relativeError * norm));
}

function cmp(a, b) {
    if(a.hasOwnProperty('compare') && b.hasOwnProperty('compare')) {
        return a.compare(b);
    }

    return a > b ? 1 : (a < b ? -1 : 0);
}

class Site {
    constructor(x = 0, y = 0, siteNum = 0) {
        this.x = x;
        this.y = y;
        this.siteNum = siteNum;
    }

    compare(other) {
        if(this.y < other.y) {
            return -1
        } else if(this.y > other.y) {
            return 1;
        } else if(this.x < other.x) {
            return -1;
        } else if(this.x > other.x) {
            return 1
        } else {
            return 0;
        }
    }

    distance(other) {
        let dx = this.x - other.x;
        let dy = this.y - other.y;
        return Math.sqrt(dx*dx + dy*dy);
    }
}

class Edge {

    constructor() {
        this.a = 0;
        this.b = 0;
        this.c = 0;

        this.ep = [null, null];
        this.reg = [null, null];

        this.edgeNum = 0;
    }

    setEndpoint(leftRightFlag, site) {
        this.ep[leftRightFlag] = site;
        if(this.ep[Edge.RIGHT_EDGE - leftRightFlag] == null) {
            return false;
        }
        return true;
    }

    static bisect(site1, site2) {
        let newEdge = new Edge();
        newEdge.reg[0] = site1;
        newEdge.reg[1] = site2;

        let dx = site2.x - site1.x;
        let dy = site2.y - site1.y;
        let adx = Math.abs(dx);
        let ady = Math.abs(dy);

        newEdge.c = site1.x * dx + site1.y * dy + (dx*dx + dy*dy) * 0.5;
        if(adx > ady) {
            newEdge.a = 1;
            newEdge.b = dy / dx;
            newEdge.c /= dx;
        } else {
            newEdge.b = 1;
            newEdge.a = dx / dy;
            newEdge.c /= dy;
        }

        newEdge.edgeNum = Edge.EDGE_NUM;
        Edge.EDGE_NUM += 1;
        return newEdge;
    }
}

Edge.LEFT_EDGE = 0;
Edge.RIGHT_EDGE = 1;
Edge.EDGE_NUM = 0;
Edge.DELETED = {};


class HalfEdge {

    constructor(edge = undefined, pm = Edge.LEFT_EDGE) {
        this.left = null;
        this.right = null;
        this.qnext = null;
        this.edge = edge;
        this.pm = pm;
        this.vertex = null;
        this.ystar = BIG_FLOAT;
    }

    compare(other) {
        if(this.ystar > other.ystar) {
            return 1;
        } else if(this.ystar < other.ystar) {
            return -1;
        } else if(this.vertex.x > other.vertex.x) {
            return 1;
        } else if(this.vertex.x < other.vertex.x) {
            return -1;
        } else {
            return 0;
        }
    }

    leftReg(def) {
        if(!this.edge) {
            return def;
        } else if(this.pm == Edge.LEFT_EDGE) {
            return this.edge.reg[Edge.LEFT_EDGE];
        } else {
            return this.edge.reg[Edge.RIGHT_EDGE];
        }
    }

    rightReg(def) {
        if(!this.edge) {
            return def;
        } else if(this.pm == Edge.LEFT_EDGE) {
            return this.edge.reg[Edge.RIGHT_EDGE];
        } else {
            return this.edge.reg[Edge.LEFT_EDGE];
        }
    }

    isPointRightOf(pt) {
        let e = this.edge;
        let topSite = e.reg[1];
        let rightOfSite = pt.x > topSite.x;
        let above;

        if(rightOfSite && this.pm == Edge.LEFT_EDGE) {
            return true;
        }

        if(!rightOfSite && this.pm == Edge.RIGHT_EDGE) {
            return false;
        }

        if(e.a == 1) {
            let dyp = pt.y - topSite.y;
            let dxp = pt.x - topSite.x;
            let fast = 0;

            if((!rightOfSite && e.b < 0) || (rightOfSite && e.b >= 0)) {
                above = dyp >= e.b * dxp;
                fast = above;
            } else {
                above = pt.x + pt.y * e.b > e.c;
                if(e.b < 0) {
                    above = !above;
                }
                if(!above) {
                    fast = 1;
                }
            }

            if(!fast) {
                let dxs = topSite.x - (e.reg[0]).x;
                above = e.b * (dxp*dxp - dyp*dyp) < dxs * dyp * (1 + 2 * dxp / dxs + e.b * e.b);
                if(e.b < 0) {
                    above = !above;
                }
            }
        } else {
            let yl = e.c - e.a * pt.x;
            let t1 = pt.y - yl;
            let t2 = pt.x - topSite.x;
            let t3 = yl - topSite.y;
            let above = t1*t1 > t2*t2 + t3*t3;
        }

        if(this.pm == Edge.LEFT_EDGE) {
            return above;
        } else {
            return !above;
        }
    }

    intersect(other) {
        let e1 = this.edge;
        let e2 = other.edge;
        if(e1 == null || e2 == null) {
            return null;
        }

        if(e1.reg[1] == e2.reg[1]) {
            return null;
        }

        let d = e1.a * e2.b - e1.b * e2.a;
        if(isEqual(d, 0)) {
            return null;
        }

        let xInt = (e1.c * e2.b - e2.c * e1.b) / d;
        let yInt = (e2.c * e1.a - e1.c * e2.a) / d;
        let he;
        let e;

        if(cmp(e1.reg[1], e2.reg[1]) < 0) {
            he = this;
            e = e1;
        } else {
            he = other;
            e = e2;
        }

        let rightOfSite = xInt >= e.reg[1].x;
        if((rightOfSite && he.pm === Edge.LEFT_EDGE) || (!rightOfSite && he.pm === Edge.RIGHT_EDGE)) {
            return null;
        }

        return new Site(xInt, yInt);
    }

}

class EdgeList {
    constructor(xMin, xMax, numSites) {
        if(xMin > xMax) {
            let temp = xMin;
            xMin = xMax;
            xMax = temp;
        }
        console.log(xMin);

        this.hashSize = Math.floor(2 * Math.sqrt(numSites + 4));

        this.xMin = xMin;
        this.deltaX = xMax - xMin;
        this.hash = Array(this.hashSize).fill(null);

        this.leftEnd = new HalfEdge();
        this.rightEnd = new HalfEdge();
        this.leftEnd.right = this.rightEnd;
        this.rightEnd.left = this.leftEnd;
        this.hash[0] = this.leftEnd;
        this.hash[1] = this.rightEnd;
    }

    insert(left, he) {
        he.left = left;
        he.right = left.right;
        left.right.left = he;
        left.right = he;
    }

    delete(he) {
        he.left.right = he.right;
        he.right.left = he.left;
        he.edge = Edge.DELETED;
    }

    getHash(b) {
        if(b < 0 || b >= this.hashSize) {
            return null;
        }
        let he = this.hash[b]
        if(he == null || he.edge != Edge.DELETED) {
            return he;
        }

        this.hash[b] = null;
        return null;
    }

    leftBound(pt) {
        let bucket = Math.floor((pt.x - this.xMin) / this.deltaX * this.hashSize);
        // console.log(this.xMin);
        // console.log(this.deltaX);
        // console.log(this.hashSize);
        
        if(bucket < 0) {
            bucket = 0;
        }
        if(bucket >= this.hashSize) {
            bucket = this.hashSize - 1;
        }

        let he = this.getHash(bucket);
        if(he == null) {
            let i = 1;
            while(true) {
                he = this.getHash(bucket - i);
                if(he != null) {
                    break;
                }

                he = this.getHash(bucket + i);
                if(he != null) {
                    break;
                }

                i++;
            }
        }

        if((he == this.leftEnd) || (he != this.rightEnd && he.isPointRightOf(pt))) {
            he = he.right;
            while(he != this.rightEnd && he.isPointRightOf(pt)) {
                he = he.right;
            }
            he = he.left;
        } else {
            he = he.left;
            while(he != this.leftEnd && !he.isPointRightOf(pt)) {
                he = he.left;
            }
        }

        if(bucket > 0 && bucket < this.hashSize - 1) {
            this.hash[bucket] = he;
        }
        return he;
    }
}

class PriorityQueue {
    constructor(yMin, yMax, numSites) {
        this.yMin = yMin;
        this.deltaY = yMax - yMin;
        this.hashSize = Math.floor(4 * Math.sqrt(numSites));
        this.count = 0;
        this.minIndex = 0;
        this.hash = [];
        
        for(let i = 0; i < this.hashSize; i++) {
            this.hash.push(new HalfEdge());
        }
    }

    length() {
        return this.count;
    }

    isEmpty() {
        return this.count == 0;
    }

    insert(he, site, offset) {
        he.vertex = site;
        he.ystar = site.y + offset;
        let last = this.hash[this.getBucket(he)];
        let next = last.qnext;
        while((next != null) && cmp(he, next) > 0) {
            last = next;
            next = last.qnext;
        }
        he.qnext = last.qnext;
        last.qnext = he;
        this.count++;
    }

    delete(he) {
        if(he.vertex != null) {
            let last = this.hash[this.getBucket(he)];
            while(last.qnext != he) {
                last = last.qnext;
            }
            last.qnext = he.qnext;
            this.count--;
            he.vertex = null;
        }
    }

    getBucket(he) {
        let bucket = Math.floor(((he.ystar - this.yMin) / this.deltaY) * this.hashSize);
        if(bucket < 0) {
            bucket = 0;
        }
        if(bucket >= this.hashSize) {
            bucket = this.hashSize - 1;
        }
        if(bucket < this.minIndex) {
            this.minIndex = bucket;
        }
        return bucket;
    }

    getMinPt() {
        while(this.hash[this.minIndex].qnext == null) {
            this.minIndex++;
        }
        let he = this.hash[this.minIndex].qnext;
        let x = he.vertex.x;
        let y = he.ystar;
        return new Site(x, y);
    }

    popMinHalfEdge() {
        let current = this.hash[this.minIndex].qnext;
        this.hash[this.minIndex].qnext = current.qnext;
        this.count--;
        return current;
    }
}

class SiteList {
    constructor(pointList) {
        this.sites = [];
        this.siteNum = 0;

        this.xMin = pointList[0].x;
        this.yMin = pointList[0].y;
        this.xMax = pointList[0].x;
        this.yMax = pointList[0].y;

        console.log(this.xMin);

        for(let i = 0; i < pointList.length; i++) {
            let pt = pointList[i];
            this.sites.push(new Site(pt.x, pt.y, i));
            if(pt.x < this.xMin) {
                this.xMin = pt.x;
            }
            if(pt.y < this.yMin) {
                this.yMin = pt.y;
            }
            if(pt.x > this.xMax) {
                this.xMax = pt.x;
            }
            if(pt.y > this.yMax) {
                this.yMax = pt.y;
            }
        }

        this.sites.sort(cmp);
    }

    setSiteNum(site) {
        site.siteNum = this.siteNum;
        this.siteNum++;
    }

    length() {
        return this.sites.length;
    }

    [Symbol.iterator]() {
        let step = 0;
        let siteList = this;

        const iterator = {
            next() {
                if(step < siteList.sites.length) {
                    return siteList.sites[step++];
                } else {
                    return null;
                }
            }
        }
        return iterator;
    }


}
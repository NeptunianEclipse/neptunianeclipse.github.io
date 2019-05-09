const canvasWidth = 600;
const canvasHeight = 600;

const canvasElement = document.getElementById('canvas');
canvasElement.width = canvasWidth;
canvasElement.height = canvasHeight;
const canvas = canvasElement.getContext('2d');

const numPoints = 50;

let points = [];
for(let i = 0; i < numPoints; i++) {
    let x = Math.random() * canvasWidth;
    let y = Math.random() * canvasHeight;

    points.push({ x: x, y: y });
}

let result = computeVoronoiDiagram(points);
console.log(result);

for(let i = 0; i < result.vertices.length; i++) {
    let vertex = result.vertices[i];
    canvas.fillStyle = 'black';
    console.log(vertex.x);
    console.log(vertex.y);
    canvas.fillRect(vertex.x, vertex.y, 2, 2);
}

for(let i = 0; i < result.edges.length; i++) {
    let edge = result.edges[i];
    if(edge[1] == -1 || edge[2] == -1) {
        continue;
    }

    let v1 = result.vertices[edge[1]];
    let v2 = result.vertices[edge[2]];

    canvas.strokeStyle = 'black';
    canvas.moveTo(v1.x, v1.y);
    canvas.lineTo(v2.x, v2.y);
    canvas.closePath();
    canvas.stroke();
}
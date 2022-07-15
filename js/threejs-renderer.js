//import * as THREE from './three.module.js';
//import * as THREE from './three.js';

import {
    BoxGeometry,
    MeshBasicMaterial,
    Mesh,
    Scene,
    Color,
    Vector2,
    Points,
    WebGLRenderer,
    BufferGeometry,
    PointsMaterial,
    AxesHelper,
    HemisphereLight,
    PerspectiveCamera,
    OrthographicCamera,
    Float32BufferAttribute,
}
from './three.module.js';

function indexFromXY(x, y, numColumns){
    return (numColumns * x) + y;
}

function xyFromIndex(i, numColumns){

  let x = Math.floor(i / numColumns) ;
  let y = i % numColumns;

  return new Vector2(x, y);
}


function remapIndex(x, y, numColumns, subdivisionLevel){

    let numNewCols = (numColumns * subdivisionLevel) - (subdivisionLevel - 1);
    let newX = x * subdivisionLevel;
    let newY = y * subdivisionLevel;
    //console.log(`numColumns: ${numColumns}, numNewCols: ${numNewCols}`);
    //console.log(`x: ${newX}, y: ${newY}`);
    
    return indexFromXY(newX, newY, numNewCols);
}

class ThreeJSRenderer {

    constructor(canvas, video) {
        this.canvas = canvas;
        console.log("Canvas: ", this.canvas);
        this.video = video;
        console.log("Video:", this.video);

        console.log("setting up ThreeJSRenderer");

        this.gl = this.canvas.getContext("webgl");
        console.log("GL:", this.gl);

        this.mediaStream = this.video.srcObject;

        this.start = Date.now();

        this.init();
    }

    init() {
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(27, window.innerWidth / window.innerHeight, 1, 3500);
        //this.camera = new OrthographicCamera(
        //    this.canvas.width / -2,
        //    this.canvas.width / +2,
        //    this.canvas.height / +2,
        //    this.canvas.height / -2,
        //    1,
        //    1000,
        //);
        this.scene.add(new AxesHelper(1));

        // Debugging CUBE
        const cubeGeometry = new BoxGeometry(640, 480, 100);
        const cubeMaterial = new MeshBasicMaterial( {color: 0xffffff} );
        const cube = new Mesh(cubeGeometry, cubeMaterial);
        this.scene.add(cube);

        //this.camera.position.x = 0;
        this.camera.position.z = 2420;
        //this.camera.position.z = 60;

        this.subDivisionLevel = 1;

        this.scene.background = new Color(0x555555);

        //const light = new HemisphereLight();
        //light.translateZ(-10);
        //this.scene.add(light);

        // Create a point cloud
        //this.MAX_POINTS_NUM = 10000; // max number of points we can allocate on the buffer
        this.spacing = 1;

        console.log(`canvas WxH: ${this.canvas.width}x${this.canvas.height}`);

        // Hardcoded for now, but this should come after reading the video.videoWidth and video.videoHeight
        // Sadly, their value can only be accessed at a specific time (using a callback)
        //const webCamWidth = 640;
        //const webCamHeight = 480;

        //const gridWidth = webCamWidth * (1 / this.subDivisionLevel);
        //const gridHeight = webCamHeight * (1 / this.subDivisionLevel);

        //this.starting = new Vector2(
        //    - (gridWidth  * 0.5),
        //    - (gridHeight * 0.5)
        //);
        //this.ending = new Vector2(
        //    + (gridWidth  * 0.5),
        //    + (gridHeight * 0.5)
        //);

        this.numColumns = 480;
        this.numRows =    480;
        this.totalPoints = this.numRows * this.numColumns;

        //console.log(`Start: ${this.starting.x}, ${this.starting.y}. End: ${this.ending.x}, ${this.ending.y}`);
        console.log(`We created ${this.numColumns} columns and ${this.numRows} rows`);
        console.log(`We will create ${this.totalPoints * 3} buffered attributes and ${this.totalPoints} points`);

        const positions = new Float32Array(this.totalPoints * 3);
        //let colors = new Float32Array(this.totalPoints * 3);
        let colors = new Float32Array(this.totalPoints * 3);

        console.log("Creating points..");
        let index = 0;

        //for (let x = this.starting.x; x <= this.ending.x; x+=this.spacing){
        //    for (let y = this.starting.y; y <= this.ending.y; y+=this.spacing){
        //for (let y = this.numRows; y > 0; y--){
        for (let y = 0; y >= -this.numRows; y--){
            //for (let x = 0; x <= this.numColumns; x++){
            for (let x = this.numColumns; x > 0; x--){
            //for (let x = 0; x <= this.numColumns; x++){
                //console.log(index);

                // Position
                positions[index + 0] = x;
                positions[index + 1] = y;
                positions[index + 2] = 100;

                index += 3;
            }
        }

        //console.log(`We created ${this.totalPoints} points out of a max of ${this.MAX_POINTS_NUM}`);

        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));

        const pointsSize = 1;
        const material = new PointsMaterial({
            size: pointsSize,
            vertexColors: true
        });
        this.points = new Points(geometry, material);
        this.scene.add(this.points);

        // Render on top of the existing canvas
        this.renderer = new WebGLRenderer({
            canvas: this.canvas,
            antialias: false
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        //document.body.appendChild(this.renderer.domElement);

        //console.log("this.subDivisionLevel: ", this.subDivisionLevel);
        //let indexForCam = remapIndex(0, 0, this.numColumns, this.subDivisionLevel);
        //console.log("indexForCam", indexForCam);

        this.invisibleCanvas = document.createElement('canvas');
        this.invisibleCanvas.width = video.videoHeight;
        this.invisibleCanvas.height = video.videoHeight;
        this.ctx = this.invisibleCanvas.getContext('2d');
        //this.ctx.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight);
        //const allVideoColors = this.ctx.getImageData(0, 0, video.videoWidth, video.videoHeight).data;
        //console.log(allVideoColors);
        //console.log(
        //     `First four colors of video: ${allVideoColors[0]}, ${allVideoColors[1]}, ${allVideoColors[2]}, ${allVideoColors[3]}`
        //);
        //console.log(this.ctx);
        //console.log(`Number of elements in camera: ${allVideoColors.length}`);
        //console.log(`Number of points: ${colors.length}`);
    }

    render() {

        // TODO: Check if OffscreenCanvas can help here
        // Draw the video first on another canvas, then read its colors by accessing that canvas
        this.ctx.drawImage(this.video, 0, 0, this.ctx.canvas.height, this.ctx.canvas.height);
        //console.log(`videoWidth: ${this.video.videoWidth}, videoHeight: ${this.video.videoHeight}`);

        // This returns a Uint8ClampedArray
        const videoData = this.ctx.getImageData(0, 0, this.ctx.canvas.height, this.ctx.canvas.height).data;

        let colors = this.points.geometry.attributes.color.array;

        let remappedColors = [];
        for (let index = 0; index < videoData.length; index+=4){
        //for (let index = videoData.length; index > 0; index-=4){
            const r = videoData[index + 0];
            const g = videoData[index + 1];
            const b = videoData[index + 2];
            const a = videoData[index + 3];
            remappedColors.push(r, g, b);
        }

        //for (let i = videoData.length; i > 0; i-=4){
        //for (let i = 0; i < remappedColors.length; i+=3){
        for (let i = 0; i < remappedColors.length; i+=3){

            //let point = xyFromIndex(i, this.numColumns);
            //let newIndex = remapIndex(point.x, point.y, this.numColumns, this.subDivisionLevel);

            colors[i + 0] = remappedColors[i + 0] / 255;
            colors[i + 1] = remappedColors[i + 1] / 255;
            colors[i + 2] = remappedColors[i + 2] / 255;
            //colors[i + 3] = videoData[i + 3] / 255;
        }

        this.points.geometry.attributes.position.needsUpdate = true; // required after the first render
        this.points.geometry.attributes.color.needsUpdate = true;

        this.renderer.render(this.scene, this.camera);
    }
}

export {
    ThreeJSRenderer
}
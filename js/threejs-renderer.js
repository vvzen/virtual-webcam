//import * as THREE from './three.module.js';
//import * as THREE from './three.js';

import {
    MathUtils,
    Scene,
    Color,
    Vector2,
    Points,
    WebGLRenderer,
    BufferGeometry,
    PointsMaterial,
    AxesHelper,
    PerspectiveCamera,
    Float32BufferAttribute,
}
from './three.module.js';

import { FontLoader } from '../jsm/FontLoader.js';
import { PCDLoader } from '../jsm/PCDLoader.js';
//import { TextGeometry } from '../jsm/TextGeometry.js';

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
        this.scene.add(new AxesHelper(1));

        // Debugging CUBE
        //const cubeGeometry = new BoxGeometry(640, 480, 100);
        //const cubeMaterial = new MeshBasicMaterial( {color: 0xffffff} );
        //const cube = new Mesh(cubeGeometry, cubeMaterial);
        //this.scene.add(cube);

        //this.camera.position.x = 0;
        this.camera.position.z = 1120;
        //this.camera.position.z = 60;

        this.subDivisionLevel = 1;

        //this.scene.background = new Color(0xaaaaaa);
        this.scene.background = new Color().setRGB(0.15, 0.15, 0.15);

        // Create a point cloud
        this.spacing = 1;

        console.log(`canvas WxH: ${this.canvas.width}x${this.canvas.height}`);

        // Hardcoded for now, but this should come after reading the video.videoWidth and video.videoHeight
        // Sadly, their value can only be accessed at a specific time (using a callback)

        this.numColumns = 640;
        this.numRows =    480;
        this.totalPoints = this.numRows * this.numColumns;

        console.log(`We created ${this.numColumns} columns and ${this.numRows} rows`);
        console.log(`We will create ${this.totalPoints * 3} buffered attributes and ${this.totalPoints} points`);

        const positions = new Float32Array(this.totalPoints * 3);
        //let colors = new Float32Array(this.totalPoints * 3);
        let colors = new Float32Array(this.totalPoints * 3);

        console.log("Creating points..");
        let index = 0;

        const offset = new Vector2(
            this.numColumns * 0.5,
            this.numRows * 0.5,
        );

        // In order to read the colors from the camera without any crazy re-indexing,
        // we create the points here according to how colors are stored in the webcamFeed
        // ThreeJS has Y up, while the camera data is Y down
        // The cam feed uses row major order, but in order to flip the image horizontally
        // we read R to L instead of L to R
        // See https://en.wikipedia.org/wiki/Row-_and_column-major_order#Row-major_order
        for (let y = 0; y >= -this.numRows; y--){
            for (let x = this.numColumns; x > 0; x--){

                // Position
                positions[index + 0] = x - offset.x;
                positions[index + 1] = y + offset.y;
                positions[index + 2] = 100;

                index += 3;
            }
        }

        //console.log(`We created ${this.totalPoints} points out of a max of ${this.MAX_POINTS_NUM}`);

        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));

        const thisInstance = this;

        // TODO: load a geometry that has the same amount of points of the
        // pointcloud we currently have, and then morph our points position
        // to that geometry

        //const textGeometryURL = 'https://github.com/vvzen/virtual-webcam/blob/feature/add-support-for-rendering-via-threejs/geometry/seeya.pcd?raw=true';
        //const textGeometryURL = 'https://github.com/vvzen/virtual-webcam/raw/feature/add-support-for-rendering-via-threejs/geometry/seeya.pcd';
        //const textGeometryURL = 'https://valerioviperino.me/assets/framestore/seeya.pcd'
        const textGeometryURL = 'https://raw.githubusercontent.com/vvzen/virtual-webcam/feature/add-support-for-rendering-via-threejs/geometry/seeya.pcd';

        //const textGeometryURL = './geometry/seeya.pcd';
        const loader = new PCDLoader();

        loader.load(textGeometryURL,
            function(targetPoints){
                console.log("Finished loading!");
                console.log(targetPoints);
                targetPoints.geometry.center();
                targetPoints.geometry.scale(300, 300, 300);
                targetPoints.material.color.setHex(0x00ff00);
                thisInstance.scene.add(targetPoints);
            },
            function(xhr){
                console.log("load in progress...");
            },
            function(err){
                console.log(err);
            }
        );

        const pointsSize = 5;
        const material = new PointsMaterial({
            size: pointsSize,
            vertexColors: true
        });
        this.points = new Points(geometry, material);
        //this.scene.add(this.points);

        // Render on top of the existing canvas
        this.renderer = new WebGLRenderer({
            canvas: this.canvas,
            antialias: false
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.invisibleCanvas = document.createElement('canvas');
        this.invisibleCanvas.width = this.numColumns;
        this.invisibleCanvas.height = this.numRows;
        this.ctx = this.invisibleCanvas.getContext('2d');
        console.log(this.invisibleCanvas);
        //this.ctx.drawImage(this.video, 0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.startTime = new Date().getTime() / 1000;
    }

    render() {
        //console.log(`videoWidth: ${this.video.videoWidth}, videoHeight: ${this.video.videoHeight}`);
        //console.log(`canvas width: ${this.ctx.canvas.width}, height: ${this.ctx.canvas.height}`);

        // TODO: Check if OffscreenCanvas can help here
        // Draw the video first on another canvas, then read its colors by accessing that canvas
        this.ctx.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight);

        // This returns a Uint8ClampedArray
        const videoData = this.ctx.getImageData(0, 0, this.video.videoWidth, this.video.videoHeight).data;

        let colors = this.points.geometry.attributes.color.array;
        let positions = this.points.geometry.attributes.position.array;

        // TODO: avoid the double loop

        // Increase the chaos (offset) over time
        this.elapsedTime = (new Date().getTime() / 1000) - this.startTime;
        //console.log(this.elapsedTime);

        const offsetMultiplier = MathUtils.mapLinear(this.elapsedTime, 0, 120, 0.0000001, 2.1);

        let remappedColors = [];
        for (let index = 0; index < videoData.length; index+=4){
            //const newIndex = this.numColumns - index;
            const r = videoData[index + 0];
            const g = videoData[index + 1];
            const b = videoData[index + 2];
            // We don't need the alpha
            const a = videoData[index + 3];
            remappedColors.push(r, g, b);
        }

        for (let i = 0; i < remappedColors.length; i+=3){

            //let point = xyFromIndex(i, this.numColumns);
            //let newIndex = remapIndex(point.x, point.y, this.numColumns, this.subDivisionLevel);
            if (Math.random() > 0.5){
                positions[i + 0] += (Math.random() - 0.5) * offsetMultiplier;
                positions[i + 1] += (Math.random() - 0.5) * offsetMultiplier;
                positions[i + 2] += (Math.random() - 0.5) * offsetMultiplier;
            }

            colors[i + 0] = remappedColors[i + 0] / 255;
            colors[i + 1] = remappedColors[i + 1] / 255;
            colors[i + 2] = remappedColors[i + 2] / 255;
        }

        this.points.geometry.attributes.position.needsUpdate = true; // required after the first render
        this.points.geometry.attributes.color.needsUpdate = true;

        this.renderer.render(this.scene, this.camera);
    }
}

export {
    ThreeJSRenderer
}
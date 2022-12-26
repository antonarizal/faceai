
faceapi.env.monkeyPatch({
    Canvas: HTMLCanvasElement,
    Image: HTMLImageElement,
    ImageData: ImageData,
    Video: HTMLVideoElement,
    createCanvasElement: () => document.createElement('canvas'),
    createImageElement: () => document.createElement('img')
})

const video = document.getElementById('videoInput')

// Promise.all([
//     faceapi.nets.faceRecognitionNet.loadFromUri('models'),
//     faceapi.nets.faceLandmark68Net.loadFromUri('models'),
//     faceapi.nets.ssdMobilenetv1.loadFromUri('models') //heavier/accurate version of tiny face detector
// ]).then(start)

Promise.all([
    faceapi.loadSsdMobilenetv1Model('models'),
    faceapi.loadFaceLandmarkModel('models'),
    faceapi.loadFaceRecognitionModel('models'),
    faceapi.loadTinyFaceDetectorModel('models'),
    faceapi.loadFaceLandmarkModel('models'),
    faceapi.loadFaceLandmarkTinyModel('models'),
    faceapi.loadFaceRecognitionModel('models'),
    faceapi.loadFaceExpressionModel('models'),
    faceapi.loadAgeGenderModel('models'),
    
  ]).then(start)
  .catch(err => console.error(err));

function start() {
    // document.body.append('Models Loaded')
    
    navigator.getUserMedia(
        { video:{} },
        stream => video.srcObject = stream,
        err => console.error(err)
    )
    
    //video.src = '../videos/speech.mp4'
    console.log('video added')
    recognizeFaces()
}

async function recognizeFaces() {

    const labeledDescriptors = await loadLabeledImages()
    console.log(labeledDescriptors)
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.7)


    video.addEventListener('play', async () => {
 
        
        console.log('Playing')
            const canvas = faceapi.createCanvasFromMedia(video);
            document.body.append(canvas);
            const displaySize = { width: video.width, height: video.height };
            faceapi.matchDimensions(canvas, displaySize);

            //Asynchronusly get detections from the video Stream
            setInterval(async () => {
            const detections = await faceapi
                .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()) //Face Detectors
                .withFaceLandmarks()  // Get cordinates of landmarks
                .withAgeAndGender()
                .withFaceExpressions()
                .withFaceDescriptors()
                ;  //Get Face Expression confidence values
            // Resize and Display the detections on the video frame using canvas
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

            // MENGGUNAKAN drawFaceLandmarks
            // const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
            // const resizedDetections = faceapi.resizeResults(detections, displaySize)
            // canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
            // faceapi.draw.drawDetections(canvas, resizedDetections)
            // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
            // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
            
            
            const results = resizedDetections.map((d) => {
                return faceMatcher.findBestMatch(d.descriptor)
            })
            results.forEach( (result, i) => {

                const boxDetect = resizedDetections[i].detection.box
                const drawBoxDetect = new faceapi.draw.DrawBox(boxDetect, { label: result.toString() })
                drawBoxDetect.draw(canvas);

                // console.log(result.toString());
                faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
                // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

                // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
                const happy = (detections[0].expressions.happy);
                console.log(detections[0])
                // document.getElementById("log").value = result + "-"+"\n";
                const textarea = document.getElementById('log');
                
                // "expressions": {
                //     "neutral": 0.9996379613876343,
                //     "happy": 0.00006336471415124834,
                //     "sad": 0.0000014079384982323973,
                //     "angry": 1.4303249429303833e-7,
                //     "fearful": 1.610501776383444e-8,
                //     "disgusted": 2.080452032870994e-9,
                //     "surprised": 0.000297063757898286
                
                // ✅ Append text
                textarea.value = "Face detected : "+result + "\n";
                textarea.value += "Gender : "+detections[0].gender +"\n";
                textarea.value += "Umur : "+Math.round(detections[0].age) +"\n";
                textarea.value += "Expression : \n";
                textarea.value += "Neutral (Netral) : "+Math.round(detections[0].expressions.neutral * 100) +"\n";
                textarea.value += "Happy (Senang) : "+Math.round(detections[0].expressions.happy* 100) +"\n";
                textarea.value += "Sad (Sedih) : "+Math.round(detections[0].expressions.sad* 100) +"\n";
                textarea.value += "Angry (Marah) : "+Math.round(detections[0].expressions.angry* 100) +"\n";
                textarea.value += "Fearful (Takut) : "+Math.round(detections[0].expressions.fearful* 100) +"\n";
                textarea.value += "Disgusted (Jijik) : "+Math.round(detections[0].expressions.disgusted* 100) +"\n";
                textarea.value += "Surprised (Terkejut) : "+Math.round(detections[0].expressions.surprised* 100) +"\n";
                                // var id_user = text[0].split(".");
                // document.getElementById("datang").value = id_user[0];
                // document.getElementById("pulang").value = id_user[0];

                // if(happy > 0.8){
                //     document.getElementById("getLabel").value = id_user[1] + " : " + "Bahagia";
                //     console.log(id_user[1] + " : happy");
                // }else{
                //     document.getElementById("getLabel").value =  "";
                //     console.log(id_user[1] + " : netral");

                // }
                })
        
            // faceapi.draw.drawDetections(canvas, resizedDetections);
            // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            // faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
            // //Printing the detection coordinates
            // console.log(detections);
            }, 100)

        
    })
}


function loadLabeledImages() {
    const labels = ['Anton Arizal','Aisyah Agustina','Nuril Ahsan','Elliya Lestari']
    //const labels = ['Prashant=7t/mc  Kumar'] // for WebCam
    return Promise.all(
        labels.map(async (label)=>{
            const descriptions = []
            for(let i=1; i<=2; i++) {
                const img = await faceapi.fetchImage(`labeled_images/${label}/${i}.jpg`)
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                console.log(label + i + JSON.stringify(detections))
                descriptions.push(detections.descriptor)
            }
            // document.body.append(label+' Faces Loaded | ')
            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}

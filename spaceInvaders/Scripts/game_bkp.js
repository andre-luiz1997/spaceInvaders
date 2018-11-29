var paddleWidth, paddleHeight, paddleDepth, paddleQuality;
var paddle1DirY = 0, paddleSpeed = 3;
var fieldWidth = 400, fieldHeight = 200;
var posCameraEixoZ = 370;
var rotacionarCameraEixoZ = 186;
var var1 = 190;
var dirCube = 1;//Indica a direção em que os inimigos estão andando em Y. +->Andar para esquerda; - ->Andar para direita
var cubeVelY = 5;//Velocidade de movimentação em Y
var cubeVelX = 30;//Velocidade de movimentação em X
var pontos = 0;
var clock = 0,clockTiroAlien = 0,  tempoTiro = 50, tempoTiroAlien = 100;//Clock para contar o tempo de cada tiro, e a variável que seta o tempo em segundos para cada tiro
var contador = new THREE.Clock();//Contador geral para o jogo
var loader = new THREE.OBJLoader();
var jogoPausado = false; //Se jogoPausado == true, deverá pausar o movimento de todos os personagens
var initGame = false;
var isGameOver = false;
var loadingManager;
var countFormacoes = 0;
var RESOURCES_LOADED = false;


//-----------------------------------------------------------
var estiloCamera = 0;
var luzAmbiente, lightEffects = false;
/* default: estiloCamera == 0 -> 3ª Pessoa(Movimento)
  estiloCamera == 1 -> Visualização superior(Fixa)
*/
var estahNoMeio = false;
//-----------------------------------------------------------
var espacoEntreCubos = 60;
var linhasInimigos = [];
var linhasAliens = [];
var posBaseX, posBaseY, posBaseZ;//Posicoes para servir de base para inserir os inimigos na cena
var nave, moon, earth, sun, saturn, spaceStation;
var vidasNave = 3;
var arrayCoracoes = [];
document.getElementById("vidas").innerHTML = vidasNave;
// Tamanho da cena
var WIDTH = 1100,HEIGHT = 600;


//////////////////Lendo os arquivos de som/////////////////////////////
// instantiate a listener
var audioListener = new THREE.AudioListener();
var backgroundMusic, laserMusic, alienLaserMusic, alienExplosionMusic, naveExplosionMusic;
/////////////////////////////////////////////////////

var models = {
	alien: {
		obj:"assets/spaceship.obj",
    mtl:"assets/spaceship.mtl",
		mesh: null
  },
  heart: {
    obj:"assets/heart/heart.obj",
    mtl:"assets/heart/heart.mtl",
    mesh: null
  }
};

// Meshes index
var meshes = {};

//////////////////Criando as partículas de explosão///////////////////////////
var movementSpeed = 10;
// var totalObjects;
var objectSize = 10;
var sizeRandomness = 4000;
var colors = [0xFF0FFF, 0xCCFF00, 0xFF000F, 0x996600, 0xFFFFFF];
/////////////////////////////////
var dirs = [];
var parts = [];
//////////////////////////////////////////////////////////////

var pauseDiv = document.querySelector("#pauseScreen");
var gameOverDiv = document.querySelector("#gameOverScreen");
var gameOverDiv2 = document.querySelector("#gameOverScreen2");
var gameStartDiv = document.querySelector("#gameStartScreen");
var gameStartBtn = document.querySelector("#btn_startGame");

$('body').append('<div id="hurt"></div>');
$('#hurt').css({width: WIDTH+10, height: HEIGHT+10,});

var tiroAlienMaterial = new THREE.MeshPhongMaterial( { color: 0xfbff00 } );
var bateu = false;
var velTiro = 10.0;
var velTiroAlien = 5.0;
//-------------------------------------------------------------------------------------
//SEÇÃO RESPONSÁVEL PELA CRIAÇÃO DOS TIROS NO GAME
var raioTiros = 5  ;
var numSegmentos = 10, numTriangulos = 10;
var tiro;
var vetorTiros = [];
var vetorTirosAlien = [];


var tiroGeometry = new THREE.SphereGeometry( raioTiros, numSegmentos, numTriangulos );
var tiroMaterial = new THREE.MeshBasicMaterial( { color: 0x00ffff } );
var cubeHeight = 70;//Largura do cubo
var cubeWidth = 50;//Altura do cubo
var cubeDepth = 30;//Profundidade do cubo
var geometry = new THREE.BoxGeometry( cubeWidth, cubeHeight, cubeDepth );
var material = new THREE.MeshPhongMaterial( {color: 0x4527A0} );
var material2 = new THREE.MeshPhongMaterial( {color: 0x0000ff} );


function setup()//Chamada quando o jogo comeca
{
  loadingManager = new THREE.LoadingManager();
	loadingManager.onProgress = function(item, loaded, total){
		// console.log(item, loaded, total);
	};
	loadingManager.onLoad = function(){
		// console.log("loaded all resources");
		RESOURCES_LOADED = true;
    onResourcesLoaded();
    
  };
  
  // Load models
	// REMEMBER: Loading in Javascript is asynchronous, so you need
	// to wrap the code in a function and pass it the index. If you
	// don't, then the index '_key' can change while the model is being
	// downloaded, and so the wrong model will be matched with the wrong
	// index key.
	for( var _key in models ){
		(function(key){
			
			var mtlLoader = new THREE.MTLLoader(loadingManager);
			mtlLoader.load(models[key].mtl, function(materials){
				materials.preload();
				
				var objLoader = new THREE.OBJLoader(loadingManager);
				
				objLoader.setMaterials(materials);
				objLoader.load(models[key].obj, function(mesh){
					
					mesh.traverse(function(node){
						if( node instanceof THREE.Mesh ){
							node.castShadow = true;
              node.receiveShadow = true;
              node.scale.set(2,2,2);
						}
					});
					models[key].mesh = mesh;
					
				});
			});
			
    })(_key);
  }
  //draw();
}


function draw()//Função que efetivamente desenha os objetos na cena
{
  if(RESOURCES_LOADED){
    requestAnimationFrame(draw);//Fazendo um loop recursivo
    renderer.render(scene, camera);//Renderizando a cena
  }
  
  cameraPhysics(!jogoPausado);
  var pCount = parts.length;
  while(pCount--) {
    parts[pCount].update();
  }
  gameStartDiv.style.visibility = "hidden";
  gameStartBtn.style.visibility = "hidden";
  if(isGameOver==false){
    if(Key.isDown(Key.P)){
      if(jogoPausado == false){
        jogoPausado = true;
        pauseDiv.style.visibility = "visible";
        gameOverDiv.style.visibility = "hidden";
        gameOverDiv2.style.visibility = "hidden";
        backgroundMusic.pause();
      }else{
        jogoPausado = false;
        pauseDiv.style.visibility = "hidden";
        backgroundMusic.play();
      }
    }

    if(Key.isDown(Key.L)){
      //Mudar o aspecto da iluminação
      if(lightEffects == false){
        lightEffects = true;
        if(luzAmbiente!=undefined){
          luzAmbiente.color.r = 0;
          luzAmbiente.color.g = 246;
          luzAmbiente.color.b = 255;
        }
        luzAmbiente.intensity = 0.005;
        // luzAmbiente.angle = 3*Math.PI/2;
      }else{
        lightEffects = false;
        if(luzAmbiente!=undefined){
          luzAmbiente.color.r = 1;
          luzAmbiente.color.g = 1;
          luzAmbiente.color.b = 1;
        }
        luzAmbiente.intensity = 2;
        luzAmbiente.angle = Math.PI;
      }
      luzAmbiente.updateWorldMatrix();
    }
    if(!jogoPausado){  
      clock++;
      clockTiroAlien++;
      if(clock == tempoTiro){
        geraTiro();
        clock = 0;
      } 
      if(clockTiroAlien == tempoTiroAlien){
        clockTiroAlien = 0;
        fazerAliensAtirarem();
      }
      if(linhasInimigos.length == 0) estahNoMeio = true;
      if(RESOURCES_LOADED && estahNoMeio && linhasInimigos.length == 0){
        //Adicionar uma nova formação quando matar todos os inimigos
        countFormacoes = 900;
        adicionaFormacaoAleatoria();
      }
      if(countFormacoes>0){
        countFormacoes--;
      }
      
      var delta = contador.getDelta();
      if(moon!=undefined){
        moon.rotation.z += delta*0.2;
      }
      if(earth!=undefined){
        earth.rotation.y += delta*0.05;
      }
      if(sun!=undefined){
        sun.rotation.z += delta*0.2;
      }
      if(saturn!=undefined){
        saturn.rotation.y += delta*0.05;
      }
      if(spaceStation!=undefined){
        
      }
      if(arrayCoracoes!=undefined){
        for (let index = 0; index < arrayCoracoes.length; index++) {
          var heart = arrayCoracoes[index];
          heart.rotation.z+=delta*0.5;
        }
      }

      
      
      
      
      for (let index = 0; index < linhasInimigos.length; index++) {
        linha = linhasInimigos[index];
        
        bateu = verificaColisaoLinha(linha);
        movimentaLinhaY(linha);
        if(bateu){
          movimentaLinhaX();
          break;
        } 
        atualizaAliens();
      }
      verificaTiroAcertouInimigo();
      verificaTiroAcertouNave();
      atualizaTiros();
      atualizaTirosAlien();
      verificaInimigosChegaramTerra();
    } else{

    }
  }
    

    if(Key.isDown(Key.R)){
      //Reiniciar o jogo
      resetGame();
    }

    
    
}



// criar um renderizador WEBGL, uma câmera e uma cena
var renderer = new THREE.WebGLRenderer();

// começa o renderizador
renderer.setSize(WIDTH, HEIGHT);

//linkar o renderizador na div que representa nosso canvas
var c = document.getElementById("gameCanvas");
c.appendChild(renderer.domElement);


//---------------------------------------------------------------
//Configurando a câmera

/*----------------------------------------- */
/*Câmera na posição 1ª ou 3ª pessoa*/
var VIEW_ANGLE = 60,
	  ASPECT = WIDTH / HEIGHT,
	  NEAR = 0.1,
    FAR = 10000;
/*----------------------------------------- */


/*----------------------------------------- */
/*Câmera na posição superior(vista de cima)*/
    // var VIEW_ANGLE = 60,
	  // ASPECT =  WIDTH / HEIGHT,
	  // NEAR = 0.1,
    // FAR = 10000;
/*----------------------------------------- */
camera = new THREE.PerspectiveCamera(
    VIEW_ANGLE,
    ASPECT,
    NEAR,
    FAR);

camera.add( audioListener );
scene = new THREE.Scene();

// add the camera to the scene
scene.add(camera);


backgroundMusic = new THREE.Audio( audioListener );
laserMusic = new THREE.Audio(audioListener);
alienExplosionMusic = new THREE.Audio(audioListener);
naveExplosionMusic = new THREE.Audio(audioListener);
alienLaserMusic = new THREE.Audio(audioListener);

// add the audio object to the scene
scene.add( backgroundMusic,  laserMusic, alienExplosionMusic, naveExplosionMusic , alienLaserMusic);

// instantiate a loader
var loaderSound = new THREE.AudioLoader();
// load a resource
loaderSound.load(
	// resource URL
	'sounds/somnolence.mp3',

	// onLoad callback
	function ( audioBuffer ) {
		// set the audio object buffer to the loaded object
		backgroundMusic.setBuffer( audioBuffer );
    backgroundMusic.setLoop( true );
    backgroundMusic.setVolume( 0.5 );
		// play the audio
		backgroundMusic.play();
	}
);

loaderSound.load(
	// resource URL
	'sounds/shoot.wav',

	// onLoad callback
	function ( audioBuffer ) {
		// set the audio object buffer to the loaded object
		laserMusic.setBuffer( audioBuffer );
    laserMusic.setVolume( 0.03 );
	}
);

loaderSound.load(
	// resource URL
	'sounds/explosion-01.wav',

	// onLoad callback
	function ( audioBuffer ) {
		// set the audio object buffer to the loaded object
		alienExplosionMusic.setBuffer( audioBuffer );
    alienExplosionMusic.setVolume( 0.03 );
	}
);

loaderSound.load(
	// resource URL
	'sounds/explosion-02.mp3',

	// onLoad callback
	function ( audioBuffer ) {
		// set the audio object buffer to the loaded object
		naveExplosionMusic.setBuffer( audioBuffer );
    naveExplosionMusic.setVolume( 0.2 );
	}
);

loaderSound.load(
	// resource URL
	'sounds/alienShoot.wav',

	// onLoad callback
	function ( audioBuffer ) {
		// set the audio object buffer to the loaded object
		alienLaserMusic.setBuffer( audioBuffer );
    alienLaserMusic.setVolume( 0.2 );
	}
);



// camera.position.z = 320; //Para a vista em 1ª ou 3ª pessoa é melhor essa vistas
camera.position.z = 900; //Para a vista superior é melhor esta distância
//---------------------------------------------------------------

// Criando uma esfera
// lower 'segment' and 'ring' values will increase performance
var radius = 5,
segments = 6,
rings = 16;

// Cria o material ESFERA
var sphereMaterial = new THREE.MeshLambertMaterial(
{
color: 0xD43001
});

// Cria uma bola com esta esfera
var ball = new THREE.Mesh(
    new THREE.SphereGeometry(radius,segments,rings),
    sphereMaterial);

// add the sphere to the scene
//scene.add(ball);

// Iluminação do "sol"
luzAmbiente = new THREE.SpotLight(0xffffff,3,0,Math.PI, 0.5, 1);
luzAmbiente.castShadow = true;

// add to the scene
scene.add(luzAmbiente);


// create the plane's material	
var planeMaterial =
new THREE.MeshPhongMaterial(
{
    color: 0x4BD121
    // color: 0xffffff
});

// create the playing surface plane
var planeWidth = WIDTH*1.0, planeHeight = HEIGHT*2.0, planeQuality=0.5;
var plane = new THREE.Mesh(
    new THREE.PlaneGeometry(
    planeWidth * 0.95,	// 95% of table width, since we want to show where the ball goes out-of-bounds
    planeHeight,
    planeQuality,
    planeQuality),
    planeMaterial);
plane.position.set(0,0,0);
// scene.add(plane);
var tableMaterial =
	  new THREE.MeshPhongMaterial(
		{
		  color: 0xffffff
		});
var table = new THREE.Mesh(

    new THREE.CubeGeometry(
      planeWidth * 5,	// this creates the feel of a billiards table, with a lining
      planeHeight * 10,
      100,				// an arbitrary depth, the camera can't see much of it anyway
      planeQuality,
      planeQuality,
      1),

    tableMaterial);
  table.position.z = -51;	// we sink the table into the ground by 50 units. The extra 1 is so the plane can be seen
  table.position.x += 2000;
  //scene.add(table);
  table.receiveShadow = false;	




var paddle1Material =
new THREE.MeshPhongMaterial(
{
    color: 0x2E7D32
});


// set up paddle 1
paddle1 = new THREE.Mesh(
  new THREE.CubeGeometry(
	paddleWidth,
	paddleHeight,
	paddleDepth,
	paddleQuality,
	paddleQuality,
	paddleQuality),
  paddle1Material);

// set up the paddle vars
paddleWidth = 10;
paddleHeight = 60;
paddleDepth = 30;
paddleQuality = 1;
// scene.add(paddle1);
paddle1.castShadow = true;
// set paddles on each side of the table
paddle1.position.x = -planeWidth/2;
// lift paddles over playing surface
paddle1.position.z = plane.position.z;
// Add the second paddle to the scene
paddle1.receiveShadow = true;
paddle1.castShadow = true;


posBaseX = planeWidth/10;
// posBaseX = -500;
posBaseY = 0;
posBaseZ = plane.position.z+(cubeDepth/2.0)+50; 

luzAmbiente.position.set(-1000, 0, 200);


function starForge() {
  /* 	Peguei essa função de referência na CODEPEN: https://codepen.io/seanseansean/pen/vEjOvy */
  var starQty = 3000;
    geometry = new THREE.SphereGeometry(1000, 0, 50);

      materialOptions = {
        size: 1.0, 
        opacity: 0.7
      };

      starStuff = new THREE.PointsMaterial(materialOptions);


  for (var i = 0; i < starQty; i++) {		

    var starVertex = new THREE.Vector3();
    starVertex.x = Math.random() * 2000 - 1000;
    starVertex.y = Math.random() * 6000 - 4000;
    starVertex.z = Math.random() * 2000 - 1000;

    geometry.vertices.push(starVertex);

  }


  stars = new THREE.Points(geometry, starStuff);
  scene.add(stars);
}









function geraTiro(){
  tiro = new THREE.Mesh( tiroGeometry, tiroMaterial);
  tiro.position.x = paddle1.position.x+60;
  tiro.position.y = paddle1.position.y;
  tiro.position.z = paddle1.position.z;
  scene.add(tiro);
  vetorTiros.push(tiro);
  laserMusic.play();
}
//-------------------------------------------------------------------------------------


//
function cameraPhysics(canMove)
{
	
	// move to behind the player's paddle
  camera.position.x = paddle1.position.x - 150;
  if(canMove){
    if(Key.isDown(Key.A)){
      paddle1.position.y += 5;
      if(paddle1.position.y >= (planeHeight/2.0) - (paddleHeight/2.0) ){
        paddle1.position.y -= 5;
      }
    } else if(Key.isDown(Key.D)){
       paddle1.position.y -= 5;
       if(paddle1.position.y <= -(planeHeight/2.0) + (paddleHeight/2.0) ){
        paddle1.position.y += 5;
      }
    }
  
    if(Key.isDown(Key.W)){
      var1+=1;
    }else if(Key.isDown(Key.S)){
      var1-=1;
    }
    nave.position.x = paddle1.position.x;
    nave.position.y = paddle1.position.y;
    nave.position.z = paddle1.position.z-20;
    atualizaCoracoes();
  }


  if(Key.isDown(Key["1"])){
    //Câmera fixa
    estiloCamera = 1;
  }else if(Key.isDown(Key["2"])){
    //Câmera em movimento
    estiloCamera = 0;
  }

  if(estiloCamera==0){
    //Câmera em movimento-> 3ª Pessoa atrás do paddle
    camera.position.y += (paddle1.position.y - camera.position.y) * 0.05;
    camera.position.z = paddle1.position.z + posCameraEixoZ + 0.04 * (-ball.position.x + paddle1.position.x);//A variável posCameraEixoZ faz a câmera subir(somar) ou descer(subtrair) no eixo Z
    camera.position.x -=200;//Mudar a posição em X corresponde a ela andar para frente ou para trás
    camera.rotation.x = -0.01 * Math.PI/180;
    camera.rotation.y = -60 * Math.PI/rotacionarCameraEixoZ;//Somar= rotaciona para baixo; diminuir= rotaciona para cima;
    camera.rotation.z = -90 * Math.PI/180;
    camera.near = 0.1;
    camera.far = 100000;
    camera.updateProjectionMatrix();
  }else if(estiloCamera == 1){
    //Câmera fixa-> Visão superior
    camera.position.set(0,0,0);
    camera.position.z+=1000;
    camera.position.x-=1000;
    camera.viewAngle = 60;
    camera.aspect = WIDTH/HEIGHT;
    camera.near = 0.1;
    camera.far = 100000;
    camera.updateProjectionMatrix();
    camera.rotation.y = -60 * Math.PI/360;//Somar= rotaciona para baixo; diminuir= rotaciona para cima;
  }
  

  
}



function atualizaTiros(){
  if(vetorTiros!=null){
    for (let index = 0; index < vetorTiros.length; index++) {
      tiro = vetorTiros[index];
      tiro.position.x+=velTiro;
    }
  }
}

function verificaTiroAcertouInimigo(){
  if(vetorTiros!=null){
    for (let i = 0; i < vetorTiros.length; i++) {
      tiro = vetorTiros[i];
      for (let index = 0; index < linhasInimigos.length; index++) {
        linha = linhasInimigos[index];  
        for (let index2 = 0; index2 < linha.length; index2++) {
          cubo = linha[index2];
          if(tiro.position.x >= 5000){
            scene.remove(tiro);
            vetorTiros.splice(i, 0);   
          }else if(
              (//Vendo se o tiro acertou horizontalmente(eixo x)
                (tiro.position.x >= cubo.position.x - cubeHeight/2)
                &&
                (tiro.position.x <= cubo.position.x + cubeHeight/2)
              )
              &&
              ( //Vendo se o tiro acertou horizontalmente(eixo y)
                (tiro.position.y >= cubo.position.y-cubeWidth/2) 
                && 
                ( tiro.position.y <= cubo.position.y+cubeWidth/2)
              )
            ){
            matarInimigo(cubo.position.x, cubo.position.y);
            vetorTiros.splice(i, 1);
            scene.remove(tiro);
          }
        }
      }         
      
    }
  }
  

}

function verificaTiroAcertouNave(){
  if(vetorTirosAlien!=null){
    for (let i = 0; i < vetorTirosAlien.length; i++) {
      tiro = vetorTirosAlien[i];
      if(tiro.position.x <= -1000){
        scene.remove(tiro);
        vetorTiros.splice(i, 0);   
      }else if(
          (//Vendo se o tiro acertou horizontalmente(eixo x)
            (tiro.position.x >= nave.position.x - paddleWidth/2)
            &&
            (tiro.position.x <= nave.position.x + paddleWidth/2)
          )
          &&
          ( //Vendo se o tiro acertou horizontalmente(eixo y)
            (tiro.position.y >= nave.position.y-paddleHeight/2) 
            && 
            ( tiro.position.y <= nave.position.y+paddleHeight/2)
          )
        ){
        vidasNave--;
        $('#hurt').fadeIn(75);
        if(arrayCoracoes!=undefined){
          coracao = arrayCoracoes.pop();
          parts.push(new ExplodeAnimation(coracao.position.x, coracao.position.y, coracao.position.z, 20, 0xff0000));
          scene.remove(coracao);
        }
        
        if(vidasNave == 0) gameOver();
        document.getElementById("vidas").innerHTML = vidasNave;
        vetorTirosAlien.splice(i, 1);
        scene.remove(tiro);
        $('#hurt').fadeOut(350);
      }
      
    }
  }
  

}

function gameOver(){
  isGameOver = true;
  jogoPausado = true;
  parts.push(new ExplodeAnimation(nave.position.x, nave.position.y,nave.position.z, 10500, nave.children[0].material.color));
  scene.remove(nave);
  naveExplosionMusic.play();
  gameOverDiv.style.visibility = "visible";
  gameOverDiv2.style.visibility = "visible";
}

function verificaColisaoLinha(linha){
  if(linha!=null && linha.length>1){
    var maisAEsquerda = 0;
    for (let index = 0; index < linha.length; index++) {
      cubo = linha[index];
      if(cubo.position.y > maisAEsquerda)maisAEsquerda = cubo.position.y;
    }
    if(maisAEsquerda >= (planeHeight/2.0) - (cubeHeight/2.0) ){
      //linha indo para esquerda. Cubo mais a esquerda bateu na parede
      dirCube = -1;
      return true;
    }else if(linha[linha.length-1].position.y <=  -(planeHeight/2.0) + (cubeHeight/2.0)){
      dirCube = 1;
      return true;
    }else{      
      return false;
    }

  }else if(linha!=null && linha.length==1){
    if(linha[0].position.y >= (planeHeight/2.0)){//linha indo para esquerda. Cubo mais a esquerda bateu na parede
      dirCube = -1;
      return true;
    }else if(linha[0].position.y <=  -(planeHeight/2.0)){
      dirCube = 1;
      return true;
    }else{      
      return false;
    }
  }
  return false;
}

function verificaInimigosChegaramTerra(){
  for (let index = 0; index < linhasInimigos.length; index++) {
    linha = linhasInimigos[index];
    for (let index2 = 0; index2 < linha.length; index2++) {
      cubo = linha[index2];
      if(cubo.position.x-cubeHeight/2 <= -planeWidth/2+30){
        //Os alieinimigos chegaram à Terra
        gameOver();
        break;
      }
    }
  }

}

function movimentaLinhaY(linha){
  //Movimenta cubo-por-cubo, na direção Y naquela linha
  if(linha!=undefined && linha[Math.floor(linha.length/2)] &&
   linha[Math.floor(linha.length/2)].position.y <= 0.5 && 
   linha[Math.floor(linha.length/2)].position.y >= -0.5){
    estahNoMeio=true;
  } else {
    estahNoMeio = false;
  }
  for (let index = 0; index < linha.length; index++) {
    cubo = linha[index];
    cubo.position.y += dirCube*cubeVelY;
  }
}

function movimentaLinhaX(){
  //Movimenta cubo-por-cubo, na direção X naquela linha
  for (let index = 0; index < linhasInimigos.length; index++) {
    linha = linhasInimigos[index];  
    for (let index2 = 0; index2 < linha.length; index2++) {
      cubo = linha[index2];
      cubo.position.x -= cubeVelX; 
    }
  }

}




function onResourcesLoaded(){
  load3DModels();
  adicionaFormacaoAleatoria();
  adicionaCoracoesVida();
  createSpacePlanets();
  starForge();
  
}



function matarInimigo(posXInimigo, posYInimigo){
  //Percorre a matriz de inimigos, encontra aquele inimigo, retira ele da matriz e da cena
  for (let index = 0; index < linhasInimigos.length; index++) {
    linha = linhasInimigos[index];
    linhaAlien = linhasAliens[index];
    if(linha.length>0){
      for (let index2 = 0; index2 < linha.length; index2++) {
        cubo = linha[index2];
        if(linhaAlien!=undefined) alien = linhaAlien[index2];
        if(cubo.position.x == posXInimigo && cubo.position.y == posYInimigo){
          //Encontrei o inimigo morto! Remover ele!
          scene.remove(cubo);  
          scene.remove(alien);
          alienExplosionMusic.play();//Toca o som de explosão
          parts.push(new ExplodeAnimation(cubo.position.x, cubo.position.y,cubo.position.z, 10, rgbToHex(cubo.material.color.r, cubo.material.color.g, cubo.material.color.b)));
          linha.splice(index2,1);//Remove aquele alien específico
          if(linha.length == 0)linhasInimigos.splice(index,1);//Remove a linha do contexto de todos os cubos
          linhaAlien.splice(index2,1);//Remove aquele alien
          if(linhaAlien.length == 0){
            linhasAliens.splice(index,1);//Remove a linha do contexto de todos os aliens
          }
          pontos++;
          if(pontos%10 == 0){
            cubeVelX += 1;
            cubeVelY += 1;
          }          
          document.getElementById("score").innerHTML = pontos;
        }
      }
    }else{//Tirar aquela linha do vetor de linhas
      linhasInimigos.splice(index,1);
      // console.log("Matou a linha toda!");
      //Adicionar uma nova linha de inimigos
      
    }
    
  }

}

function rgbToHex(r, g, b) {
  return "0x" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function load3DModels(){
  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setPath("assets/");
  mtlLoader.load("spaceship.mtl", function(materials){
      materials.preload();
      var objLoader = new THREE.OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath("assets/");
      objLoader.load("spaceship.obj", function(object){
        object.position.x = paddle1.position.x;
        object.position.y = paddle1.position.y;
        object.position.z = paddle1.position.z-20;
        object.rotation.x = Math.PI/2;
        object.rotation.y = Math.PI/2;
        object.scale.set(20,20,20);
        nave = object;
        scene.add(nave);
        luzAmbiente.lookAt(nave);
        }        
      );

    }
  );
}



function createSpacePlanets(){
  var moonGeo = new THREE.SphereGeometry(300, 32, 16);
  var earthGeo = new THREE.SphereGeometry(100, 32, 16);
  var sunGeo = new THREE.SphereGeometry(10, 32, 16);
  var moonTexture = new THREE.TextureLoader().load("images/moon.jpg");
  var earthTexture = new THREE.TextureLoader().load("images/earth.jpg");
  var sunTexture = new THREE.TextureLoader().load("images/sun.jpg");
  var moonMaterial = new THREE.MeshLambertMaterial({map: moonTexture});
  var earthMaterial = new THREE.MeshPhongMaterial({map: earthTexture});
  var sunMaterial = new THREE.MeshLambertMaterial({map: sunTexture});
  
  moon = new THREE.Mesh(moonGeo, moonMaterial);
  earth = new THREE.Mesh(earthGeo, earthMaterial);
  sun = new THREE.Mesh(sunGeo, sunMaterial);
  scene.add(moon);
  scene.add(earth);
  //scene.add(sun);
  moon.position.y = 1200;
  earth.scale.set(3,3,3);
  earth.position.x = paddle1.position.x - 250;
  earth.position.y = paddle1.position.y;
  earth.position.z = paddle1.position.z -300;
  earth.rotation.x = 20;
  sun.position.x = 10000;
  sun.position.y = 0;
  sun.position.z = -500;

  
  


  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setPath("assets/saturn/");
  mtlLoader.load("saturn.mtl", function(materials){
      materials.preload();
      var objLoader = new THREE.OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath("assets/saturn/");
      objLoader.load("saturn.obj", function(object){
          saturn = object;
          saturn.scale.set(200,200,200);
          saturn.rotation.x = 20;
          saturn.position.z-=1000;
          saturn.position.y-=1000;
          scene.add(saturn);
        }        
      );

    }
  );

  mtlLoader.setPath("assets/spaceStation/");
  mtlLoader.load("Zenith_OBJ.mtl", function(materials){
      materials.preload();
      var objLoader = new THREE.OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath("assets/spaceStation/");
      objLoader.load("Zenith_OBJ.obj", function(object){
        spaceStation = object;
        spaceStation.scale.set(20,20,20);
        spaceStation.rotation.z = 50;
        spaceStation.position.y = 350;
          scene.add(spaceStation);
          moon.add(spaceStation);

        }        
      );
    }
  );
  
}

function ativarControls(camera){
  
  controls = new THREE.TrackballControls( camera );

  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;

  controls.noZoom = false;
  controls.noPan = false;

  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;

  controls.keys = [ 65, 83, 68 ];
  controls.target.set( 0, 0, 0 );

  controls.addEventListener( 'change', render );
  controls.enabled = false;
}

function render() {
  renderer.render( scene, camera );
}


function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function adicionaFormacaoAleatoria(){
  var opcao = getRandomInt(1,4);
  switch(opcao){
    case 1:
      adicionaFormacaoCubosCena( [1,1,1,1,1]);
      adicionaFormacaoCubosCena( [0,1,1,1,0]);
      adicionaFormacaoCubosCena( [0,0,1,0,0]);
      posBaseX = planeWidth/10;
      break;
    case 2:
      adicionaFormacaoCubosCena( [0,0,1,0,0]);
      adicionaFormacaoCubosCena( [0,1,1,1,0]);
      adicionaFormacaoCubosCena( [1,1,1,1,1]);
      posBaseX = planeWidth/10;
      break;
    case 3:
      adicionaFormacaoCubosCena( [1,0,1,0,1]);
      adicionaFormacaoCubosCena( [0,1,1,1,0]);
      adicionaFormacaoCubosCena( [1,0,1,0,1]);
      posBaseX = planeWidth/10;
      break;
    case 4:
      adicionaFormacaoCubosCena( [1,1,1,1,1]);
      adicionaFormacaoCubosCena( [1,1,1,1,1]);
      adicionaFormacaoCubosCena( [1,1,1,1,1]);
      posBaseX = planeWidth/10;
      break;
  }
  
}


function atualizaAliens(){
  var alien;
  for (let index = 0; index < linhasInimigos.length; index++) {
    linha = linhasInimigos[index];  
    linhaAlien = linhasAliens[index];
    for (let index2 = 0; index2 < linha.length; index2++) {
      cubo = linha[index2];
      if(linhaAlien!=undefined){
        alien = linhaAlien[index2];
        alien.position.x = cubo.position.x;
        alien.position.y = cubo.position.y;
        alien.position.z = cubo.position.z-35;
        // if(dirCube == -1){
        //   alien.rotation.z = -Math.PI/16;
        // }else{
        //   alien.rotation.z = Math.PI/16;
        // } 
      }
    }
  }
}


function adicionaFormacaoCubosCena(formacao){
  var linha = [];//Linha que conterá os inimigos criados
  var posRelativaY = 0;
  posRelativaY += cubeHeight +espacoEntreCubos;
  //////////////Adicionar à esquerda do inimigo do meio/////////////////////////////
  for (let index = Math.floor(formacao.length/2)-1; index >= 0; index--) {
    ehInimigo = formacao[index];
    if(ehInimigo == 1){ //Inserir um inimigo naquela posicao
      inimigo = new THREE.Mesh( geometry, material );//Criando o novo inimigo
      inimigo.position.x = posBaseX;
      inimigo.position.y = posBaseY+posRelativaY;
      inimigo.position.z = posBaseZ;
      linha.push(inimigo);
    }
    posRelativaY += cubeHeight +espacoEntreCubos;
  }
  ///////////////////////////////////////////////////////////
  //////////////////Adicionar inimigo do meio/////////////////////////////
  var meio = Math.floor(formacao.length/2);
  if(formacao[meio] == 1){
    var inimigo = new THREE.Mesh(geometry, material);
    inimigo.position.x = posBaseX;
    inimigo.position.y = posBaseY;
    inimigo.position.z = posBaseZ;
    linha.push(inimigo);
  }
  posRelativaY = cubeHeight +espacoEntreCubos;
  ///////////////////////////////////////////////////////////
  for (let index = Math.ceil(formacao.length/2); index < formacao.length; index++) {
    ehInimigo = formacao[index];
    if(ehInimigo == 1){ //Inserir um inimigo naquela posicao
      inimigo = new THREE.Mesh( geometry, material );//Criando o novo inimigo
      inimigo.position.x = posBaseX;
      inimigo.position.y = posBaseY-posRelativaY;
      inimigo.position.z = posBaseZ;
      linha.push(inimigo);
    }
    posRelativaY += cubeHeight +espacoEntreCubos;
  }
  ///////////////////////////////////////////////////////////
  linhasInimigos.push(linha);
  ///////////////////Adicionando os novos inimigos na cena//////////////////////////////
  var linhaDeAliens = [];
  
  var alienMaterial =
  new THREE.MeshPhongMaterial(
  {
      color: (Math.random()*0xFFFFFF<<0)
  });
  for (let index2 = 0; index2 < linha.length; index2++) {
    cubo = linha[index2];
    cubo.position.z-=30;
    alien = models.alien.mesh.clone();
    alien.children[0].material = alienMaterial;
    alien.position.x = cubo.position.x;
    alien.position.y = cubo.position.y;
    alien.position.z = cubo.position.z-35;
    alien.rotation.x = Math.PI/2;
    alien.rotation.y = 3*Math.PI/2;
    alien.scale.set(15,10,10);
    scene.add(alien);
    linhaDeAliens.push(alien);
    // scene.add(cubo);
  }
  linhasAliens.push(linhaDeAliens);
  posBaseX += (cubeWidth+espacoEntreCubos);//Colocando o espaço para inserir a nova formação
}



function geraTiroAlien(posXAlien, posYAlien, posZAlien){
  tiro = new THREE.Mesh( tiroGeometry, tiroAlienMaterial);
  tiro.position.x = posXAlien-20;
  tiro.position.y = posYAlien;
  tiro.position.z = posZAlien;
  scene.add(tiro);
  vetorTirosAlien.push(tiro);
  alienLaserMusic.play();
}


function atualizaTirosAlien(){
  if(vetorTirosAlien!=null){
    for (let index = 0; index < vetorTirosAlien.length; index++) {
      tiro = vetorTirosAlien[index];
      tiro.position.x-=velTiroAlien;
    }
  }
}

function fazerAliensAtirarem(){
  for (let index = 0; index < linhasInimigos.length; index++) {
    linha = linhasInimigos[index];
    //A primeira linha sempre pode atirar
    if(index == 0){
      for (let index2 = 0; index2 < linha.length; index2++) {
        //Percorrer a linha toda e mandar cada elemento atirar
        alien = linha[index2];
        geraTiroAlien(alien.position.x,alien.position.y,alien.position.z);
      }

    }else{//Para as outras linhas, tem que checar se não tem nenhum alien na frente
      for (let index2 = 1; index2 < linha.length; index2++) {
        alien = linha[index2];
        var podeAtirar = true;
        //Percorre as linhas anteriores para ver se não tem alien à frente
        for (let linhaAnterior = 0; linhaAnterior < index2; linhaAnterior++) {
          linhaAnterior = linhasInimigos[linhaAnterior];
          for (let posicoesAliensAnteriores = 0; posicoesAliensAnteriores < linhaAnterior.length; posicoesAliensAnteriores++) {
            alienAnterior = linhaAnterior[posicoesAliensAnteriores];
            //Encontrou um alien à frente. Não pode atirar!
            if(alienAnterior.position.y <= alien.position.y+15 &&
               alienAnterior.position.y >= alien.position.y-15){
               podeAtirar = false;
               break;
            }
          }
          if(podeAtirar == false){
            break;
          }
        }
        if(podeAtirar)geraTiroAlien(alien.position.x,alien.position.y,alien.position.z);
      }

    }
  }

}

function adicionaCoracoesVida(){
  var posRelativaY = -50;
  for (let index = 0; index < vidasNave; index++) {
    var coracao = models.heart.mesh.clone();
    coracao.children[0].material.color.setHex(0xff0000);
    coracao.position.x = paddle1.position.x;
    coracao.position.y = paddle1.position.y+posRelativaY;
    coracao.position.z = paddle1.position.z+300;
    coracao.children[0].scale.set(0.3,0.3,0.3);
    coracao.children[0].rotation.set(Math.PI/2,Math.PI/2, 0);
    arrayCoracoes.push(coracao);
    scene.add(coracao);
    posRelativaY-=50;
  }
}

function atualizaCoracoes(){
  var posRelativaY = 50;
  for (let index = 0; index < arrayCoracoes.length; index++) {
    coracao = arrayCoracoes[index];
    coracao.position.y = nave.position.y+posRelativaY;
    posRelativaY-=50;
  }
}


function ExplodeAnimation(x,y,z, totalObjects, explosionColor)
{
  var geometry = new THREE.Geometry();
  
  for (i = 0; i < totalObjects; i ++) 
  { 
    var vertex = new THREE.Vector3();
    vertex.x = x;
    vertex.y = y;
    vertex.z = z;
  
    geometry.vertices.push( vertex );
    dirs.push({x:(Math.random() * movementSpeed)-(movementSpeed/2),y:(Math.random() * movementSpeed)-(movementSpeed/2),z:(Math.random() * movementSpeed)-(movementSpeed/2)});
  }
  var material = new THREE.PointsMaterial( { size: objectSize,  color: explosionColor});
  var particles = new THREE.Points( geometry, material );
  
  this.object = particles;
  this.status = true;
  
  this.xDir = (Math.random() * movementSpeed)-(movementSpeed/2);
  this.yDir = (Math.random() * movementSpeed)-(movementSpeed/2);
  this.zDir = (Math.random() * movementSpeed)-(movementSpeed/2);
  
  scene.add( this.object  ); 
  
  this.update = function(){
    if (this.status == true){
      var pCount = totalObjects;
      while(pCount--) {
        var particle =  this.object.geometry.vertices[pCount]
        particle.y += dirs[pCount].y;
        particle.x += dirs[pCount].x;
        particle.z += dirs[pCount].z;
      }
      this.object.geometry.verticesNeedUpdate = true;
    }
  }
  
}

function resetGame(){
  //Função que restarta o game, setando todas as variáveis para o default
  countFormacoes = 0;
  jogoPausado = false;
  clock = 0,clockTiroAlien = 0,  tempoTiro = 50, tempoTiroAlien = 100;
  pontos = 0;
  dirCube = 1;
  estiloCamera = 0;
  lightEffects = false;
  estahNoMeio = false;
  scene = new THREE.Scene();
  linhasInimigos = [];
  linhasAliens = [];
  vidasNave = 3;
  arrayCoracoes = [];
  vetorTiros = [];
  vetorTirosAlien = [];
  bateu = false;
  linhaDeAliens = [];
  paddle1.position.y = 0;
  scene.add( backgroundMusic,  laserMusic, alienExplosionMusic, naveExplosionMusic , alienLaserMusic);
  scene.add(camera);
  scene.add(luzAmbiente);
  scene.add(nave);
  scene.add(moon);
  scene.add(earth);
  scene.add(saturn);
  scene.add(spaceStation);
  moon.add(spaceStation);
  adicionaFormacaoAleatoria();
  adicionaCoracoesVida();
  starForge();
  document.getElementById("score").innerHTML = '0';
  document.getElementById("vidas").innerHTML = vidasNave;
  gameStartDiv.style.visibility = "hidden";
  gameStartBtn.style.visibility = "hidden";
  gameOverDiv.style.visibility = "hidden";
  gameOverDiv2.style.visibility = "hidden";
  pauseDiv.style.visibility = "hidden";
  isGameOver = false;
}

//                  Mínimos quadrados
// Espaço de estados
//Prática de AR da temperatura
//Prática da temperatura previsão livre
//Função de correlação parte 1
//Função de correlação parte 2
//Modelo ARX(último com 14 questões)


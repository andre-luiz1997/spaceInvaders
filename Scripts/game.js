var paddleWidth, paddleHeight, paddleDepth, paddleQuality;
var paddle1DirY = 0, paddleSpeed = 3;
var fieldWidth = 400, fieldHeight = 200;
var posCameraEixoZ = 370;
var rotacionarCameraEixoZ = 186;
var var1 = 190;
var dirCube = 1;//Indica a direção em que os inimigos estão andando em Y. +->Andar para esquerda; - ->Andar para direita
var cubeVelY = 3;//Velocidade de movimentação em Y
var cubeVelX = 30;//Velocidade de movimentação em X
var pontos = 0;
var clock = 0, tempoTiro = 70;//Clock para contar o tempo de cada tiro, e a variável que seta o tempo em segundos para cada tiro
var contador = new THREE.Clock();//Contador geral para o jogo
var loader = new THREE.OBJLoader();
var jogoPausado = false; //Se jogoPausado == true, deverá pausar o movimento de todos os personagens
var loadingManager;
//-----------------------------------------------------------
var estiloCamera = 0;
var controls;
/* default: estiloCamera == 0 -> 3ª Pessoa(Movimento)
  estiloCamera == 1 -> Visualização superior(Fixa)
*/

//-----------------------------------------------------------


var nave, moon, earth, sun, saturn, spaceStation;

// Tamanho da cena
var WIDTH = window.innerWidth-10,HEIGHT =window.innerHeight-20;

var models = {
	alien: {
		obj:"assets/naveAlien/SpaceShip.obj",
		mtl:"assets/naveAlien/SpaceShip.mtl",
		mesh: null
	}
};

// Meshes index
var meshes = {};

function setup()//Chamada quando o jogo comeca
{
  loadingManager = new THREE.LoadingManager();
	loadingManager.onProgress = function(item, loaded, total){
		console.log(item, loaded, total);
	};
	loadingManager.onLoad = function(){
		console.log("loaded all resources");
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
						}
					});
					models[key].mesh = mesh;
					
				});
			});
			
    })(_key);
  }
  draw();
}


function draw()//Função que efetivamente desenha os objetos na cena
{
    if(Key.isDown(Key.P)){
      if(jogoPausado == false){
        jogoPausado = true;
      }else{
        jogoPausado = false;
      }
    }
    requestAnimationFrame(draw);//Fazendo um loop recursivo
    renderer.render(scene, camera);//Renderizando a cena
    if(!jogoPausado){  
      clock++;
      if(clock == tempoTiro){
        // geraTiro();
        clock = 0;
      } 
      var delta = contador.getDelta();
      if(moon!=undefined){
        moon.rotation.z += delta*0.2;
      }
      if(earth!=undefined){
        earth.rotation.y += delta*0.2;
      }
      if(sun!=undefined){
        sun.rotation.z += delta*0.2;
      }
      if(saturn!=undefined){
        saturn.rotation.y += delta*0.05;
      }
      if(spaceStation!=undefined){
        
      }
      
      cameraPhysics(true);
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
      atualizaTiros();
      verificaInimigosChegaramTerra();
    } else{
      ativarOrbitControls(camera, renderer.domElement);
      controls.update();
      cameraPhysics(false);
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

scene = new THREE.Scene();

// add the camera to the scene
scene.add(camera);


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
pointLight = new THREE.SpotLight(0xffffff,2,0,Math.PI, 0.5, 1);


// add to the scene
scene.add(pointLight);


// create the plane's material	
var planeMaterial =
new THREE.MeshPhongMaterial(
{
    //color: 0x4BD121
    color: 0xffffff
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
//scene.add(plane);
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
// set up the paddle vars
paddleWidth = 10;
paddleHeight = 35;
paddleDepth = 10;
paddleQuality = 1;



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

// add the paddle to the scene
// scene.add(paddle1);
paddle1.castShadow = true;


starForge();
function starForge() {
  /* 	Peguei essa função de referência na CODEPEN: https://codepen.io/seanseansean/pen/vEjOvy */
  var starQty = 10000;
    geometry = new THREE.SphereGeometry(1000, 0, 50);

      materialOptions = {
        size: 1.0, 
        transparency: true, 
        opacity: 0.7
      };

      starStuff = new THREE.PointCloudMaterial(materialOptions);


  for (var i = 0; i < starQty; i++) {		

    var starVertex = new THREE.Vector3();
    starVertex.x = Math.random() * 2000 - 1000;
    starVertex.y = Math.random() * 6000 - 4000;
    starVertex.z = Math.random() * 2000 - 1000;

    geometry.vertices.push(starVertex);

  }


  stars = new THREE.PointCloud(geometry, starStuff);
  scene.add(stars);
}




// Add the second paddle to the scene
paddle1.receiveShadow = true;
paddle1.castShadow = true;
var cubeHeight = 50;//Largura do cubo
var cubeWidth = 50;//Altura do cubo
var cubeDepth = 10;//Profundidade do cubo
var geometry = new THREE.BoxGeometry( cubeWidth, cubeHeight, cubeDepth );
var material = new THREE.MeshPhongMaterial( {color: 0x4527A0} );
var material2 = new THREE.MeshPhongMaterial( {color: 0x0000ff} );

var espacoEntreCubos = 60;
var linhasInimigos = [];
var linhasAliens = [];
var posBaseX, posBaseY, posBaseZ;//Posicoes para servir de base para inserir os inimigos na cena
posBaseX = 3*fieldWidth;
posBaseY = fieldHeight - espacoEntreCubos;
posBaseZ = plane.position.z+(cubeDepth/2.0)+50; 

adicionaFormacaoCubosCena([1,1,1,1,1,1,1]);
adicionaFormacaoCubosCena([0,1,1,1,1,1,0]);
adicionaFormacaoCubosCena([0,0,1,1,1,0,0]);
adicionaFormacaoCubosCena([1,1,1,1,1,1,1]);
adicionaFormacaoCubosCena([0,1,1,1,1,1,0]);
adicionaFormacaoCubosCena([0,0,1,1,1,0,0]);
adicionaFormacaoCubosCena([1,1,1,1,1,1,1]);
adicionaFormacaoCubosCena([0,1,1,1,1,1,0]);
adicionaFormacaoCubosCena([0,0,1,1,1,0,0]);

function adicionaFormacaoCubosCena(formacao){
  var linha = [];//Linha que conterá os inimigos criados
  var posRelativaY = 0;
  for (let index = 0; index < formacao.length; index++) {
    ehInimigo = formacao[index];
    if(ehInimigo == 1){ //Inserir um inimigo naquela posicao
      var inimigo = new THREE.Mesh( geometry, material );//Criando o novo inimigo
      inimigo.position.x = posBaseX;
      inimigo.position.y = posBaseY-posRelativaY;
      inimigo.position.z = posBaseZ;
      linha.push(inimigo);
    }
    posRelativaY += cubeHeight +espacoEntreCubos;
  }
  linhasInimigos.push(linha);
  posBaseX += -(cubeWidth+espacoEntreCubos);//Colocando o espaço para inserir a nova formação
}

// set paddles on each side of the table
paddle1.position.x = -planeWidth/2;

// lift paddles over playing surface
paddle1.position.z = paddleDepth;

pointLight.position.set(-1000, 0, 200);

load3DModels();
createSpacePlanets();
// adicionaAliensCena();//Função para adicionar os cubos na cena
//-------------------------------------------------------------------------------------
//SEÇÃO RESPONSÁVEL PELA CRIAÇÃO DOS TIROS NO GAME
var raioTiros = 5  ;
var numSegmentos = 10, numTriangulos = 10;
var tiro;
var vetorTiros = [];

var tiroGeometry = new THREE.SphereGeometry( raioTiros, numSegmentos, numTriangulos );
var tiroMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );

function geraTiro(){
  tiro = new THREE.Mesh( tiroGeometry, tiroMaterial);
  tiro.position.x = paddle1.position.x+60;
  tiro.position.y = paddle1.position.y;
  tiro.position.z = paddle1.position.z;
  scene.add(tiro);
  vetorTiros.push(tiro);
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
    nave.position.z = paddle1.position.z;
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
var bateu = false;
var velTiro = 5.0;

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
          if(tiro.position.x >= FAR/10){
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

function gameOver(){
  jogoPausado = true;
}

function verificaColisaoLinha(linha){
  if(linha!=null && linha.length>1){
    if(linha[0].position.y >= (planeHeight/2.0) - (cubeHeight/2.0) ){//linha indo para esquerda. Cubo mais a esquerda bateu na parede
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
      if(cubo.position.x-cubeHeight/2 <= -planeWidth/2){
        //Os alieinimigos chegaram à Terra
        gameOver();
        break;
      }
    }
  }

}

function movimentaLinhaY(linha){
  //Movimenta cubo-por-cubo, na direção Y naquela linha
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

function atualizaAliens(){
  for (let index = 0; index < linhasInimigos.length; index++) {
    linha = linhasInimigos[index];  
    linhaAlien = linhasAliens[index];
    for (let index2 = 0; index2 < linha.length; index2++) {
      cubo = linha[index2];
      alien = linhaAlien[index2];
      alien.position.x = cubo.position.x;
      alien.position.y = cubo.position.y;
      alien.position.z = cubo.position.z;
      if(dirCube == -1){
        alien.rotation.z = -Math.PI/16;
      }else{
        alien.rotation.z = Math.PI/16;
      }
    }
  }
}

var alien;
function adicionaAliensCena(){
  //Percorre o array com os cubos e adiciona eles na cena
  for (let index = 0; index < linhasInimigos.length; index++) {
    linha = linhasInimigos[index];
    var linhaDeAliens = [];
    for (let index2 = 0; index2 < linha.length; index2++) {
      cubo = linha[index2];
      alien = models.alien.mesh.clone();
      alien.position.x = cubo.position.x;
      alien.position.y = cubo.position.y;
      alien.position.z = cubo.position.z;
      alien.rotation.x = Math.PI/2;
      alien.rotation.y = 3*Math.PI/2;
      alien.scale.set(10,10,10);
      scene.add(alien);
      linhaDeAliens.push(alien);
      // scene.add(cubo);
    }
    linhasAliens.push(linhaDeAliens);
  }
}

function onResourcesLoaded(){
  adicionaAliensCena();
}



function matarInimigo(posXInimigo, posYInimigo){
  //Percorre a matriz de inimigos, encontra aquele inimigo, retira ele da matriz e da cena
  for (let index = 0; index < linhasInimigos.length; index++) {
    linha = linhasInimigos[index];
    linhaAlien = linhasAliens[index];
    for (let index2 = 0; index2 < linha.length; index2++) {
      cubo = linha[index2];
      alien = linhaAlien[index2];
      if(cubo.position.x == posXInimigo && cubo.position.y == posYInimigo){
        //Encontrei o inimigo morto! Remover ele!
        linha.splice(index2,1);
        linhaAlien.splice(index2,1);
        scene.remove(cubo);  
        scene.remove(alien);
        pontos++;
        document.getElementById("score").innerHTML = pontos;
      }
    }
  }

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
        object.position.z = paddle1.position.z;
        object.rotation.x = Math.PI/2;
        object.rotation.y = Math.PI/2;
        object.scale.set(20,20,20);
        nave = object;
        scene.add(nave);
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
  var moonMaterial = new THREE.MeshPhongMaterial({map: moonTexture});
  var earthMaterial = new THREE.MeshLambertMaterial({map: earthTexture});
  var sunMaterial = new THREE.MeshLambertMaterial({map: sunTexture});
  
  moon = new THREE.Mesh(moonGeo, moonMaterial);
  earth = new THREE.Mesh(earthGeo, earthMaterial);
  sun = new THREE.Mesh(sunGeo, sunMaterial);
  scene.add(moon);
  scene.add(earth);
  //scene.add(sun);
  moon.position.y = 1000;
  earth.position.x += 1000;
  earth.position.y -= 1000;
  earth.position.z -= 100;
  earth.rotation.x = 20;
  sun.position.x = 10000;
  sun.position.y = 0;
  sun.position.z = -500;

  // var textureFlare0 = new THREE.TextureLoader().load( 'images/lensflare0.png' );
  // var sunLight = new THREE.PointLight(0xffffff, 1.5, 2000);
  // //sunLight.color.setHSL( 202, 0.1, 0.5 );
  // sunLight.position.set(sun.position.x,sun.position.y,sun.position.z );
  // scene.add(sunLight);
  // var lensflare = new THREE.Lensflare();
  // lensflare.addElement( new THREE.LensflareElement( textureFlare0, 1000, 0, sunLight.color ) );
  // sunLight.add( lensflare );


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

function ativarOrbitControls(camera, elem){
  controls = new THREE.OrbitControls(camera, elem);
}


/**
 * YTplayer
 * Date: 2023-01-19
 * Version: 0.1 beta
 * Authors: Mauricio Severo and Tarcisio Rodrigues
 */

console.log(`
    ToDO List:
    - implementar volume
    - implementar cc
    - implementar intro personalizada 
    - implementar assinatura personalizada
    - implementar links de avançar e voltar
    - implementar thumbnail
    - implementar multiplos players
    - implementar a função de retomar o vídeo de onde parou (youtube.playVideoAt(index:Number):Void)
    - implementar a opção de payse e playe a partir do click no modal
    - implementar a velocidade do player (youtube.getPlaybackRate():Number) //0.25, 0.5, 1, 1.5 e 2
    - BUG: corrigir o bug do fullscreen (quando dá esc para sair não troca o botão)
    - BUG: o logotipo fica encima do progressbar e não é possível clicar nele
    - tratar o caso de não receber um logotipo
    - pausar o player antes do final para que não apareça as sugestões de vídeo
    - adicionar opção de trocar ícones
    - tratar o tamanho do título para que não extrapole a linha
    - testar responsividade
    - verificar integração com chromecast
    - criar hooks para adicionar ações ao player


`);



/** 
 * @typedef { Object } PlayerConfig
 * @property { string } title - O título do vídeo que aparecerá acima do player.
 * @property { string } url - O link do vídeo no youtube.
 * @property { string } videoid - O id do vídeo. Você pode optar por usar 'url' ou 'videoid'.
 * @property { string } logo - Opcionalmente você adicionar seu logotipo no player basta inserir a url da imagem.
 */

/**
 * Representador de elemento.
 */
class ChainableElementRepresenter {
    /**
     * Cria um novo representador de elemento.
     * @param { HTMLElement } element - O elemento a ser representado.
     **/
    constructor(element) {
        this.element = element;
    }

    /**
     * Adiciona um elemento filho ao elemento representado.
     * @param { HTMLObject | ChainableElementRepresenter } child - O elemento filho que será adicionado. Poder ser um elemento HTML ou um outro ChainableElementRepresenter.
     * @returns Retorna a si mesmo para fazer chain.
     */
    appendChild(child) {
        if(child.element !== undefined){
            this.element.appendChild(child.element);
        }else{
            this.element.appendChild(child);
        }
        return this;
    }

    /**
     * Insere um texto à propriedade innerText do elemento representado.
     * @param { string } text - O texto a ser inserido.
     * @returns Retorna a si mesmo para fazer chain.
     */
    setText(text){
        this.element.innerText = text;
        return this;
    }

    /**
     * Insere um código HTML à propriedade innerHTML do elemento representado.
     * @param { string } html - O código HTML a ser inserido.
     * @returns Retorna a si mesmo para fazer chain.
     */
    setHtml(html){
        this.element.innerHTML = html;
        return this;
    }

    /**
     * Insere um elemento html na determinada posição relativa ao elemento representado.
     * @param { string } position - A posição em que o elemento será inserido.
     * @param { HTMLElement } element - O elemento a ser inserido.
     * @returns Retorna a si mesmo para fazer chain.
     */
    insertAdjacentElement(position, element) {
        this.element.insertAdjacentElement(position, element);
        return this;
    }

    /**
     * Adiciona um ouvinte de evento ao elemento que este objeto representado.
     * @param { string } - O tipo do evento a ser adicionado.
     * @param { Function } - A função de callback para o evento.
     * @returns Retorna a si mesmo para fazer chain.
     */
    on(event, fn){
        this.element.addEventListener(event, fn);
        return this;
    }

    /**
     * Torna o elemento visível no player
     * @returns Retorna a si mesmo para fazer chain.
     */
    show(){
        this.element.classList.remove('yt-player-element-hidden');
        return this;
    }

    /**
     * Oculta um elemento do player
     * @returns Retorna a si mesmo para fazer chain.
     */
    hide(){
        this.element.classList.add('yt-player-element-hidden');
        return this;
    }

    fadeOut(){
        if(!this.element.classList.contains('yt-player-effect')){
            this.element.classList.add('yt-player-effect');
        }

        this.element.style.opacity = '0.0';
        return this;
    }
    fadeIn(){
        if(this.element.style.opacity == '1.0'){
            return this;
        }
        if(!this.element.classList.contains('yt-player-effect')){
            this.element.classList.add('yt-player-effect');
        }

        this.element.style.opacity = '1.0';
        return this;
    }
}


/**
 * Define as configurações default do player.
 * Algumas das configurações não devem ser alteradas,
 */
class YTplayer {

    config = {
        sectionid: 'yt-player',
        iframeTitle: "YTplayer",
        width: '100%',
        height: '100%',
        accelerometer: true,
        autoplay: false,
        clipboardWrite: true,
        encryptedMedia: true,
        gyroscope: true,
        pictureInPicture: true,
        webShare: false,
        allowfullscreen: true,
        frameborder: 0,
        icons: "default"
    };




    /** 
     * @param { PlayerConfig } init - Configurações para o player.
     */
    constructor(init) {
        //--variáveis da classe
        let url = null; // url do vídeo
        let title = null; // título do vídeo
        let logo = null; // url da imagem do logo que aparecerá no player
        let icons = null; // pack de icones que serão mostrados no player
        let currentTime = '00:00'; // tempo do vídeo assistido até o momento
        let videoLenght = '00:00'; // tamanho do vídeo
        let videoid = null; // vídeoid do youtube
        let playerElement = null; //elemento player que fica acima do player do youtube
        let youtube = null; // player do youtube que será controlado pelo player element 
    
        //variáveis do player
        let plElemPreviusVideo = null; //recebe o elemento html responsável pelo vídeo/link passado
        let plElemPlay =  null; // elemento html do botão play
        let plElemPause =  null; // elemento html do botão pause
        let plElemNextVideo =  null; // elemento html do botão que direciona para o próximo vídeo
        let plElemVolume =  null;  // elemento html do botão vloume
        let plElemTimeCurrentTime =  null;  // elemento html do texto contendo o tempo atual decorrido do vídeo
        let plElemTimeVideoLenght =  ''; // elemento html texto que mostra o tamanho do vídeo
        let plElemTitle = null; // elemento thml que mostra o título do vídeo
        let plElemCaption = null; //elemento html relacionado às legendas
        let plElemFullscreenOff = null; // elemento html do botão para sair do fullscreen
        let plElemFullscreenOn = null; // elemento html do botão para entrar em modo fullscreen
        let plElemControler = null; // elemento com os controladore do vídeo
        let plLogoContent = null; //elemento container que recebe a imagem do logo personalizado
        let plLogoImg = null; // elemento imagem que recebe o logo personalizado
        let plElementProgressBar = null; //div da barra de progresso
        let plElemLightModal = null; // quando aperta na luz para apagar o que está ao redor, esse elemento fica do tamanho da tela e escurece ao redor do vídeo.
        let plBtnLight = null;// botão de desligar a luz
        let plBtnLightOn = null;//botão de ligar a luz

        this.url = init.url;
        this.title = init.title;
        this.logo = init.logo;
        this.icons = this._loadIcons();

        if (!this.videoid) {
            this.videoid = this._ytParser(this.url);
        }
        if(init.sectionid){
            this.sectionid = init.sectionid;
        }
        
        this.url = "https://www.youtub.com/embed/" + this.videoid + "?controls=0";
        this.playerElement = document.getElementById(this.config.sectionid);

        this._playerRender();
    }

    controlersFadeOut(){
        if(globalThis.ytPlayer.youtube.getPlayerState() == 1){
            globalThis.ytPlayer.plElemControler.fadeOut();
            globalThis.ytPlayer.plElemTitle.fadeOut();
        }
    }
    controlersFadeIn(){
        globalThis.ytPlayer.plElemControler.fadeIn();
        globalThis.ytPlayer.plElemTitle.fadeIn();
    }

    /**
     * @description esta função dá play no vídeo.
     */
    play() { 
        globalThis.ytPlayer.youtube.playVideo(); //para o vídeo no player do youtube
        globalThis.ytPlayer.plElemPlay.hide();
        globalThis.ytPlayer.plElemPause.show();
        setTimeout(function(){
            globalThis.ytPlayer.controlersFadeOut();
        }, 5000);//5 segumdos para desaparecer o logo do youtube
    }

    /**
     * @description esta função pausa o vídeo
     */
    pause() { 
        globalThis.ytPlayer.youtube.pauseVideo();
        globalThis.ytPlayer.plElemPlay.show();
        globalThis.ytPlayer.plElemPause.hide();
    }
    nextVideo() { console.log('nextVideo'); }
    volumeControl() { console.log('volumeControl'); }
    caption() { console.log('caption'); }

    /**
     * @description esta função coloca o vídeo em fullscreen
     */
    fullscreenOn() {
        let aux = document.getElementById(globalThis.ytPlayer.config.sectionid);
        console.log(globalThis.ytPlayer.config.sectionid);
        if (aux.requestFullscreen) {
            aux.requestFullscreen();
        } else if (aux.webkitRequestFullscreen) { /* Safari */
            aux.webkitRequestFullscreen();
        } else if (aux.msRequestFullscreen) { /* IE11 */
            aux.msRequestFullscreen();
        }
        globalThis.ytPlayer.plElemFullscreenOff.show();
        globalThis.ytPlayer.plElemFullscreenOn.hide();
     }

     /**
        @description esta função remove o vídeo do fullscreen
      * 
      */
    fullscreenOff() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
        globalThis.ytPlayer.plElemFullscreenOn.show();
        globalThis.ytPlayer.plElemFullscreenOff.hide();
    }

    /**
     * Thread que atualiza o tempo decorrido do vídeo a cada meio segundo
     * Esta Thread também atualiza o percentual decorrido do vídeo
     */
    currentTimeThreadStart() {
        let videoLenght = globalThis.ytPlayer.youtube.getDuration();
        let duration = YTplayer._formatYTDateTime(videoLenght);

        globalThis.ytPlayer.videoLenght = videoLenght;
        globalThis.ytPlayer.plElemTimeVideoLenght.setText(duration);

        setInterval(function(){
            let currentSeconds = globalThis.ytPlayer.youtube.getCurrentTime();
            let current = YTplayer._formatYTDateTime(currentSeconds);
            globalThis.ytPlayer.currentTime = currentSeconds;
            globalThis.ytPlayer.plElemTimeCurrentTime.setText(current);

            let videoLenght = parseInt(globalThis.ytPlayer.videoLenght);
            let percentil = (currentSeconds*100)/videoLenght;

            globalThis.ytPlayer.plElementProgressBar.element.style.setProperty('--progressbar-percentil', percentil+'%');
        }, 100);//a cada meio segundo, atualiza as informações do vídeo
       
    }

    /**
     * Quando alguém clica na barra de progresso, este método é disparado.
     */
    changeVideoPoint(event){
        let w = globalThis.ytPlayer.plElementProgressBar.element.offsetWidth;
        console.log(event);
        let _w = event.offsetX;
        let p = (_w*100)/w;

        let videoLenght = parseInt(globalThis.ytPlayer.videoLenght);
        var newStartSecond = (videoLenght*p)/100;

        console.log('total: '+w+" click: "+_w+" percentil: "+p+" newStart: "+newStartSecond);
        
        
        globalThis.ytPlayer.youtube.seekTo(newStartSecond);



    }
    videoLength() { console.log('videoLength'); }
    lightOn() { 
        globalThis.ytPlayer.plElemLightModal.element.style.visibility = 'hidden';
        globalThis.ytPlayer.plElemLightModal.element.style.opacity = '0.0';
        globalThis.ytPlayer.plBtnLightOn.element.style.display = 'none';
        globalThis.ytPlayer.plBtnLight.element.style.display = 'block';
    }


    lightOff() { 
        globalThis.ytPlayer.plElemLightModal.element.style.visibility = 'visible';
        globalThis.ytPlayer.plElemLightModal.element.style.opacity = '1';
        globalThis.ytPlayer.plBtnLightOn.element.style.display = 'block';
        globalThis.ytPlayer.plBtnLight.element.style.display = 'none';


     }

   /**
    * Retorna o tempo (em segundos) queo vídeo foi reproduzido.
    * @returns seconds
    */
    getCurrentTime(){
        return parseInt(this.currentTime);
    }
    /**
     * As funções getCurrentTime() e getDuration() da APi do YouTube retornam o valor em segundos.
     * Esta função transforma os segundos em uma string formatada 00:00:00
     * @param {string} seconds 
     * @returns 
     */
    static _formatYTDateTime(seconds){
        let d = Number(seconds);
        let h = Math.floor(d / 3600);
        let m = Math.floor(d % 3600 / 60);
        let s = Math.floor(d % 3600 % 60);
    
        let hDisplay = h > 0 ? (h >= 10 ? h : "0"+h)+":" : "";
        let mDisplay = m > 0 ? (m >= 10 ? m : "0"+m)+":" : "00:";
        let sDisplay = s > 0 ? (s >= 10 ? s : "0"+s)+"" : "00";


        return hDisplay + mDisplay + sDisplay; 
        
    }

    /**
     * Cria e retorna um representador de elemento.
     * @param  { string } type - A tag do elemento html a ser criado.
     * @param { Object } options - Os atributos a serem definidos para o elemento.
     * @returns { ChainableElementRepresenter }
     */
    _createElement(type, option){
        let element = document.createElement(type);
        setAttributes(element, option);
        
        return new ChainableElementRepresenter(element);
    }

    /**
     * Adiciona o player à pagina.
     */
    _playerRender() {
        this._iframeRender();
        let plModal = this._createElement('div',{'class': 'yt-player-modal'}).on('mouseover',this.controlersFadeIn).on('mouseout',this.controlersFadeOut);
        this.plElemTitle = this._createElement('div',{'class': 'yt-player-title'}).setHtml(this.title);
        
        plModal.appendChild(this.plElemTitle);
        
        this.plElemControler        = this._createElement('div',{'class': 'yt-player-controler'});
        this.plElementProgressBar   = this._createElement('div',{'class': 'yt-player-progressbar yt-player-effect'}).on('click',this.changeVideoPoint);
        let plInlineLight           = this._createElement('span',{'class': 'yt-player-btn yt-player-controlers-top-right'});
        this.plBtnLight              = this._createElement('a',{'href': '#','class':'yt-player-light yt-player-btn'})
            .setHtml(this.icons.lightOn)
            .on('click', this.lightOff);
        this.plBtnLightOn              = this._createElement('a',{'href': '#','class':'yt-player-light yt-player-btn','style':'display: none;'})
            .setHtml(this.icons.lightOff)
            .on('click', this.lightOn);

        this.plElemLightModal       = this._createElement('div',{'class': 'yt-player-modal-light-off'});

        plInlineLight.appendChild(this.plBtnLight);
        plInlineLight.appendChild(this.plBtnLightOn);
        this.plElemControler.appendChild(plInlineLight);
        this.plElemControler.appendChild(this.plElementProgressBar);
        
        let plElemControlersLeft = this._createElement('span',{'class':'yt-player-controlers-left' });

        this.plElemPreviusVideo    = this._createElement('a', {'href': '#', 'class': 'yt-player-back yt-player-btn yt-player-element-hidden'}).setHtml(this.icons.back).on('click', this.previousVideo);
        this.plElemPlay    = this._createElement('a', {'href': '#', 'class': 'yt-player-play yt-player-btn'}).setHtml(this.icons.play).on('click',this.play);
        this.plElemPause   = this._createElement('a', {'href': '#', 'class': 'yt-player-pause yt-player-btn yt-player-element-hidden'}).setHtml(this.icons.pause).on('click',this.pause);
        this.plElemNextVideo    = this._createElement('a', {'href': '#', 'class': 'yt-player-next yt-player-btn yt-player-element-hidden'}).setHtml(this.icons.next).on('click',this.nextVideo);
        this.plElemVolume  = this._createElement('a', {'href': '#', 'class': 'yt-player-volume yt-player-btn'}).setHtml(this.icons.volumeFull).on('click',this.volumeControl);
        
        let plElemTime    = this._createElement('span',{'class':'yt-player-time'});
        this.plElemTimeCurrentTime    = this._createElement('span',{'class':'yt-player-currenttime'}).setText(this.currentTime);
        this.plElemTimeVideoLenght    = this._createElement('span',{'class':'yt-player-videolength'}).setText(this.videoLenght);
        plElemTime.appendChild(this.plElemTimeCurrentTime)
                    .appendChild(this.plElemTimeVideoLenght);


        plElemControlersLeft.appendChild(this.plElemPreviusVideo)
                        .appendChild(this.plElemPlay)
                        .appendChild(this.plElemPause)
                        .appendChild(this.plElemNextVideo)
                        .appendChild(this.plElemVolume)
                        .appendChild(plElemTime);
       


        let plElemControlersCenter   = this._createElement('span',{'class':'yt-player-controlers-center'});
        let plElemControlersRight    = this._createElement('span',{'class':'yt-player-controlers-right'});
        
        this.plElemCaption             = this._createElement('a', {'href': '#', 'class': 'yt-player-caption yt-player-btn yt-player-element-hidden'}).setHtml(this.icons.caption).on('click',this.caption);
        this.plElemFullscreenOff       = this._createElement('a', {'href': '#', 'class': 'yt-player-fullscreen-exit yt-player-btn yt-player-element-hidden'}).setHtml(this.icons.fullscreenOff).on('click',this.fullscreenOff);
        this.plElemFullscreenOn        = this._createElement('a', {'href': '#', 'class': 'yt-player-fullscreen yt-player-btn'}).setHtml(this.icons.fullscreen).on('click',this.fullscreenOn);
        plElemControlersRight.appendChild(this.plElemCaption)
                        .appendChild(this.plElemFullscreenOff)
                        .appendChild(this.plElemFullscreenOn);


        this.plLogoSpan      = this._createElement('span',{'class':'yt-player-logo'});
        this.plLogoImg       = this._createElement('img',{'src':this.logo,'alt':'logo'});
                        
        this.plLogoSpan.appendChild(this.plLogoImg);


        this.plElemControler.appendChild(plElemControlersLeft);
        this.plElemControler.appendChild(plElemControlersCenter);
        this.plElemControler.appendChild(plElemControlersRight);
        this.plElemControler.appendChild(this.plLogoSpan);
        plModal.appendChild(this.plElemControler);
        this.playerElement.appendChild(plModal.element);
        this.playerElement.appendChild(this.plElemLightModal.element);


        /* //a organização do código acima gera o html abaixo
            div.yt-player-modal
                div.yt-player-title ${this.title}
                div.yt-player-controler
                    span.yt-player-btn yt-player-controlers-top-right
                        a.yt-player-light yt-player-btn ${this.icons.lightOn}
                    span.yt-player-controlers-left
                        a.yt-player-back yt-player-btn yt-player-element-hidden ${this.icons.back}
                        a.yt-player-play yt-player-btn ${this.icons.play}
                        a.yt-player-pause yt-player-btn yt-player-element-hidden ${this.icons.pause}
                        a.yt-player-next yt-player-btn yt-player-element-hidden ${this.icons.next}
                        a.yt-player-volume yt-player-btn ${this.icons.volumeFull}
                        span.yt-player-time
                            span.yt-player-currenttime ${this.currentTime}
                            span.yt-player-videolength ${this.videoLength}
                    span.yt-player-controlers-center
                    span.yt-player-controlers-right
                        a.yt-player-caption yt-player-btn yt-player-element-hidden ${this.icons.caption}
                        a.yt-player-fullscreen-exit yt-player-btn yt-player-element-hidden ${this.icons.fullscreenOff}
                        a.yt-player-fullscreen yt-player-btn ${this.icons.fullscreen}
                div.yt-player-logo
                    img src ${this.logo}
            */

    }

    /**
     * Configura o iframe
     */
    _iframeRender() {
        //primeiro configura o allow
        let allow = this._ytAllow();

        let iframeContainer = this._createElement('div',{'id':'youtube-player', 'class':'youtube-player','style':'position: relative; z-index: 9900 !important;'});
        this.playerElement.appendChild(iframeContainer.element);


        let tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        let firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        let ytframe = document.getElementById('youtube-player');
        
        setAttributes(ytframe,{
            'src': this.url,
            'width': this.config.width,
            'height': this.config.height,
            'height': this.config.height,
            'frameborder': this.config.frameborder,
            'title': this.config.iframeTitle,
            'allow': allow,
            'allowfullscreen': 'allowfullscreen'

        });

        globalThis.onYouTubeIframeAPIReady = this.onYouTubeIframeAPIReady;
        globalThis.ytPlayer = this;
    }

    /**
     * Manipulador de evento da API de Iframe do YouTube. É acionado assim que a API estiver pronta.
     */
    onYouTubeIframeAPIReady(){
        globalThis.ytPlayer.youtube  = new YT.Player('youtube-player', {
            height: globalThis.ytPlayer.config.height,
            width: globalThis.ytPlayer.config.width,
            videoId: globalThis.ytPlayer.videoid,
            playerVars: {'controls': 0},
            events: {
                'onReady': globalThis.ytPlayer.youtubeOnPlayerReady,
                'onStateChange': globalThis.ytPlayer.youtubeOnPlayerStateChange,
                'onPlaybackQualityChange': globalThis.ytPlayer.youtubeOnPlayerPlaybackQualityChange,
                'onError': globalThis.ytPlayer.youtubeOnPlayerError

            }
        });
        
    }

    /**
     * Manipulador de evento da API de Iframe do YouTube. É acionado assim que o player estiver pronto.
     */
    youtubeOnPlayerReady(event) {
        console.log("youtubeOnPlayerReady");

        globalThis.ytPlayer.currentTimeThreadStart();
        
    }

    /**
     * Manipulador de evento da API de Iframe do YouTube. É acionado quando o estado do player muda.
     */
    youtubeOnPlayerStateChange(event){
        console.log("youtubeOnPlayerStateChange");
        console.log(event.data);

        if(event.data == YT.PlayerState.PLAYING){
            globalThis.ytPlayer.play();
        }

        if(event.data == YT.PlayerState.PAUSE){
            globalThis.ytPlayer.pause();
        }

        
        if(event.data == YT.PlayerState.BUFFERING){
            
        }

        if(event.data == YT.PlayerState.ENDED){
            
        }


    }

    /**
     * Manipulador de evento da API de Iframe do YouTube. É acionado quando há uma mudança na qualidade de exibição do vídeo.
     */
    youtubeOnPlayerPlaybackQualityChange(event){
        console.log("youtubeOnPlayerPlaybackQualityChange");
        console.log(event.data);
    }

    /**
     * Manipulador de evento da API de Iframe do YouTube. É acionado quando o player retorna algum erro.
     */
    youtubeOnPlayerError(event){
        console.log(event.data);
        if(event.data == 2){
            console.log("ERRO INFORMADO PELO YOUTUBE");
            console.log("A solicitação contém um valor de parâmetro inválido. Por exemplo, este erro ocorre se você especificar um ID de vídeo que não tem 11 caracteres, ou se o ID de vídeo contém caracteres inválidos, como pontos de exclamação ou asteriscos.");
        }

        if(event.data == 5){
            console.log("ERRO INFORMADO PELO YOUTUBE");
            console.log("O conteúdo solicitado não pode ser reproduzido em um player HTML5, ou ocorreu outro erro relacionado ao player HTML5.");
        }

        if(event.data == 100){
            console.log("ERRO INFORMADO PELO YOUTUBE");
            console.log("O vídeo solicitado não foi encontrado. Esse erro ocorrerá quando um vídeo tiver sido removido (por qualquer motivo) ou marcado como privado.");
        }

        if(event.data == 101){
            console.log("ERRO INFORMADO PELO YOUTUBE");
            console.log("O proprietário do vídeo solicitado não permite que ele seja reproduzido em players incorporados.");
        }

        if(event.data == 150){
            console.log("ERRO INFORMADO PELO YOUTUBE");
            console.log("Esse erro é o mesmo que o 101. É apenas um erro 101 disfarçado.");
        }
    }

    /**
     * Cria e retorna o allow do iframe
     * @returns { string }
     */
    _ytAllow() {
        let allow = "";
        if (this.config.accelerometer) allow = "accelerometer;";
        if (this.config.autoplay) allow += "autoplay;";
        if (this.config.clipboardWrite) allow += "clipboard-write;";
        if (this.config.encryptedMedia) allow += "encrypted-media;";
        if (this.config.gyroscope) allow += "gyroscope;";
        if (this.config.pictureInPicture) allow += "picture-in-picture;";
        if (this.config.webShare) allow += "web-share;";
        return allow;
    }


    /**
     * Recebe um link do youtube e retorna apenas o ID do vídeo
     * @param { string } url - O link para o vídeo no YouTube.
     * @returns { string | boolean }
     * 
     * Testes
     * http://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index
     * http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/QdK8U-VIH_o
     * http://www.youtube.com/v/0zM3nApSvMg?fs=1&amp;hl=en_US&amp;rel=0
     * http://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s
     * http://www.youtube.com/embed/0zM3nApSvMg?rel=0
     * http://www.youtube.com/watch?v=0zM3nApSvMg
     * http://youtu.be/0zM3nApSvMg
     */
    _ytParser(url) {
        var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        var match = url.match(regExp);
        return (match && match[7].length == 11) ? match[7] : false;
    }

    _loadIcons() {
        let iconsPack = {
            'default': {
                'play': '<i class="bi bi-play-fill"></i>',
                'pause': '<i class="bi bi-pause"></i>',
                'next': '<i class="bi bi-skip-end"></i>',
                'back': '<i class="bi bi-skip-start"></i>',
                'volumeFull': '<i class="bi bi-volume-up"></i>',
                'volumeDown': '<i class="bi bi-volume-down"></i>',
                'volumeMute': '<i class="bi bi-volume-mute"></i>',
                'fullscreen': '<i class="bi bi-fullscreen"></i>',
                'fullscreenOff': '<i class="bi bi-fullscreen-exit"></i>',
                'caption': '<i class="bi bi-badge-cc"></i>',
                'lightOn': '<i class="bi bi-lightbulb-off"></i>',
                'lightOff': '<i class="bi bi-lightbulb"></i>'

            }
        };

        let bootstrapicons = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css">';
        document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeend', bootstrapicons);

        this.icons = iconsPack['default'];
        return iconsPack['default'];
    }

    /*
    * Método que mostra como utilizar a biblioteca
    */
    static help() {
        console.log(`
        /**
         * 'title' é o título do vídeo que aparecerá acima do player
         * 'url' é o link do vídeo no youtube
         * 'videoid' é o id do vídeo. Você pode optar por usar 'url' ou 'videoid'
         * 'logo' se vc quiser adicionar seu logotipo no player basta inserir a url da imagem
         * 'icons' define o pacote de ícones que será utilizado
         * por padrão, o player utiliza os ícones do bootstrap
         * */
        <script>

            var jYTplayer = new YTplayer({
                title: '',
                url: '',
                videoid: '',
                logo: false,
                icons: "default" 
            }).start();
        </script>
        `);
    }
};

/**
 * Defini atributos para um elemento.
 * @param { HTMLElement } element - O elemento que terá seus atributos definidos.
 * @param { Object } attributes - Os atributos a serem definidos.
 */
function setAttributes(element, attributes) {
    for (var key in attributes) {
        element.setAttribute(key, attributes[key]);
    }
}
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable func-names */
/* eslint-disable quote-props */
import puppeteer from 'puppeteer';
import * as dbUtil from './util/databaseUtil';
import uuidv4 from 'uuid/v4';
import async from 'async';
import * as shell from 'shelljs';
// eslint-disable-next-line func-names
const url = 'https://zingmp3.vn/album/Chieu-Thu-Hoa-Bong-Nang-Single-DatKaa/6Z7EAIUA.html';

let browser;
let page;
const alpha = 0;

// adding comment

const listComment = [
  'Bài hát rất hay, rất ấn tượng, mình cực kỳ thích giọng bạn này',
  'Hán chán quá, không có cảm xúc',
  'Hay thật sự mọi người ạ',
  'Giọng hát đầy nội lực',
  `Mình thấy như này
  Mấy bạn phải like cmt tương tác lẫn nhau thì người mới cmt sẽ có động lực cmt nữa
  Like khiến con người ta chăm bình luận hơn
  Mình nghĩ như vậy đó`,
  'Tui xem từ nữa đêm đến giờ, hơi bị buồn đấyy nha. Chả có ai đồng hành hết :< ai động viên tui tui đi',
  'Đừng bỏ cuộc ae!! Chỉ là bị chặn do nhiều người xem thôi!!  Cứ xem hết mình!!! ><',
  'If you still support him and listen to his songs every day, you\'re definitely a big fan of him.',
  'Việt nam điểm danh ,chứ t thấy hoang mang quá độc mấy bố nước ngoài comment',
  'Nghe nói âm thầm bên em hiện đang top1 bên Lào',
  'Nếu k có anh làm sao e biết được tình yêu có giá trị như thế',
  `Dù thời gian có xóa phai nhòa
  Lạc trôi những kí ức
  Bạn tôi vẫn thế không hề đổi thay trái tim.`,
  'Vậytạisao, tình yêumàanh đã trao..',
  'Anhyeuem , emkhongyeuanh',
  'Anhkhôngbiết yêuem saohovừa',
  'Anhkhôngbiết ngọt ngàohaytrăng sao...',
  'Lord forgive me for watching this',
  `Ai công nhận 2019 toàn HIT hay
  Tui chưa kịp học lời bài này thì bài kia đã ra rồi`,
  'Fan Chuyên Cần Thích Nghe Nhạc Chill Điểm Danh Nào',
  'SẮP ĐI LÍNH RỒI 2 NĂM NỮA VỀ MONG ĐC 1 LIKE',
  'OMG she’s so pretty and charming',
  'Nghe xong bài này mai đi nghĩa vụ mong 2 năm sau về được 10 like',
  'From Indonesian❤big love for this song!',
  'Hình như t là ng đóng góp lượt xem thứ 12M ',
  'Khắc Hưng là 1 trong những của hiếm trong sản xuất âm nhạc hiện nay của Showbiz Việt..hâm mộ anh',
  'Ai thấy bài này đỉnh thì like nghiện từ lần nghe đầu tiên',
  `Bài này hay phết 
  Thấy nó đứng top nên xem thư ải ngờ nghiện luôn`,
  `Dù em là con mèo trắng ngu ngốc
  Nhưng em vẫn cứ đâm đầu yêu anh`,
  'Bài này chill phết',
  'bài này khó quá rồi ,sao mà ai đó " co vơ " lại được',
  'I need to know where she got the beaded floral top asap. It is totally to die for <3',
  `Ngoài Trời Xanh Màu Lá
  Vừa Mới Bị Bồ Đá`
]
const addComment = function() {
  return new Promise(async (resolve, reject) => {
    const sqlUserId = 'SELECT id FROM users';
    const sqlSongId = 'SELECT id FROM songs';
    const addCmtSql = `
      INSERT INTO comments(id, userId, songId, content)
      VALUES (?,?,?,?)
    `;
    const userIdArr = await dbUtil.query(sqlUserId);
    const songIdArr = await dbUtil.query(sqlSongId);
    console.log(userIdArr);
    for(let i = 0; i< 500; i++){
      // get user
      const userIdRandom = userIdArr[Math.round(Math.random() * (userIdArr.length - 1))].id;
      console.log('ran id', userIdRandom);
      // get content
      const commentRandom = listComment[Math.round(Math.random() * listComment.length)];
      console.log('ran id', commentRandom);
      // get song
      const songRandom = songIdArr[Math.round(Math.random() * (songIdArr.length-1 ))].id;
      console.log('song id', songRandom);
      // insert
      const id = uuidv4();
      await dbUtil.execute(addCmtSql, [id, userIdRandom, songRandom, commentRandom]);
      await sleep(500);
    }
  })
}

// addComment();
const boostrap = function () {
  return new Promise(async (resolve) => {
    browser = await puppeteer.launch({
      userDataDir: `./DataAccChromnium/khang`,
      defaultViewport: null,
      headless:false,
    });
    page = await browser.newPage();
    const info = await startGame();
    await saveInDb(info);
    process.exit(0);
  });
};
boostrap();
const saveInDb = async function({
  name,
  singer,
  album,
  writer,
  categories,
  imgSinger,
  imgSong,
  mp3Url,
  length
}){
  const transaction = await dbUtil.beginTransaction();
  try{
    const checkAlbum = await checkAlbumExist(album);
    // album da ton tai hay chua
    let albumExist;
    // id 
    let albumId;
    
    let songId = uuidv4();
    // check neu co roi tang so luong bai hat
    if(checkAlbum){
      albumId = checkAlbum;
      albumExist = true;
      // const inceaseNumber = 'UPDATE album SET songNumber +=1 WHERE id = ?';
      // await dbUtil.execute(inceaseNumber, [albumId], transaction);
    }else{
      // ko thi tao album moi
      albumId = uuidv4();
      albumExist = false;
      if(album){
        const addAlbumSql = 'INSERT INTO album(id,name,img) VALUES(?,?,?)';
        await dbUtil.execute(addAlbumSql, [albumId, album, imgSong], transaction);
      }
    }
    
    
    // them categories
    for(let i = 0; i< categories.length; i++){
      console.log('checking category: ', categories[i]);
      let checkCate = await checkCategoryExist(categories[i]);
      if(checkCate){
        const sql = 'INSERT INTO song_categories(songId, categoryId) VALUES(?,?)';
        await dbUtil.execute(sql, [songId, checkCate], transaction);
      }else{
        const cateId = uuidv4();
        const addCateSql = 'INSERT INTO categories(id,name) VALUES(?, ?)';
        await dbUtil.execute(addCateSql, [cateId, categories[i]], transaction);
        const sql = 'INSERT INTO song_categories(songId, categoryId) VALUES(?,?)';
        await dbUtil.execute(sql, [songId, cateId], transaction);
      }
    }
  
    // them bai hat
    const songSql = 'INSERT INTO songs(id,name,image,length,albumId,writer,url) VALUES(?,?,?,?,?,?,?)';
    await dbUtil.execute(songSql,[songId,name,imgSong,length,albumId,writer,mp3Url], transaction);
    

    for(let i = 0; i< singer.length; i++){
      const checkSinger = await checkSingerExist(singer[i]);
      let singerId;
      // tuong tu voi singer
      if(checkSinger){
        singerId = checkSinger;
      }else{
        // ko thi tao singer moi
        singerId = uuidv4();
        const addSingerSql = 'INSERT INTO singers(id,name,avatar) VALUES(?,?,?)';
        await dbUtil.execute(addSingerSql, [singerId, singer[i], imgSinger], transaction);
      }
      // them singer_album
      if(album && !albumExist){
        const singerAlbumSql = 'INSERT IGNORE INTO singer_album(albumId,singerId) VALUES(?,?)';
        await dbUtil.execute(singerAlbumSql, [albumId, singerId], transaction);
      }
      // them vao singer_song
      const singerSongSql = 'INSERT INTO singer_song(singerId,songId) VALUES(?,?)';
      await dbUtil.execute(singerSongSql, [singerId, songId], transaction);
    }
      console.log("chuan bi commit ne");
      await dbUtil.commitTransaction(transaction);
  }catch(e){
    console.log(e);
    await dbUtil.rollbackTransaction(transaction);
  }
}
const startGame = async function () {
  await page.goto(url);
  await page.waitFor(".txt-primary", {timeout: 5000});
  await sleep(2000);
  await page.evaluate(() => {
    document.querySelector('.media-control-button.media-control-icon.paused').click()
  })
  const data = await page.evaluate((_) => {
    let arrCategories = [];
    let arrSinger = [];
    console.log( document.querySelector('.txt-primary'));
    document.querySelector('.media-control-button.media-control-icon.paused').click()
    const name = document.querySelector('.txt-primary')?  document.querySelector('.txt-primary').innerText.split('-')[0].trim() : null;
    // get singer
    const listSinger = document.querySelector('.txt-primary')? document.querySelector('.txt-primary') : null;
    if(listSinger){
      const elements = listSinger.querySelectorAll('a');
      elements.forEach((doc) => {
        console.log(doc);
        arrSinger.push(doc.innerText.split(',')[0]);
      })
    }
    const album = document.querySelector('.txt-info').innerText? document.querySelector('.txt-info').innerText : null;
    const writer = document.querySelector('#composer-container')? document.querySelector('#composer-container').innerText.trim() : null;
    const numberCate = document.querySelectorAll('.info-song-top.otr.clear a').length || null;
    const imgSinger = document.querySelector('.box-artist img').src || null;
    const imgSong = document.querySelector('.album-bg img').src || null;
    const lengthRaw = document.querySelectorAll('.media-control-indicator')[1].innerText || '04:34';
    const lengthString = lengthRaw;
    console.log(lengthString);
    const minute = lengthString.split(':')[0];
    const second = lengthString.split(':')[1];
    const length =parseInt(minute * 60) + parseInt(second);
    for(let i = 0; i < numberCate; i++ ){
      arrCategories.push(document.querySelectorAll('.info-song-top.otr.clear a')[i].attributes.title.textContent);
    }
    document.querySelectorAll('.button-style-1.pull-left.fn-tab')[1].click();
    return {
      name,
      singer: arrSinger,
      album,
      writer,
      categories: arrCategories,
      imgSinger,
      imgSong,
      length,
    }
  })
  console.log("ten ca si:", data.singer);
  await sleep(1000);
  await page.click('.z-download-pkg-btn.fn-128.fn-tracking-download');
  await sleep(6000);
  const listTemp = await shell.exec('ls ~/Documents/Code/Project-1/Back-end_MP3_Online/Temp');
  const mp3Url = listTemp.stdout.split('\n')[0];
  await shell.exec(`mv ~/Documents/Code/Project-1/Back-end_MP3_Online/Temp/${mp3Url} ~/Documents/Code/Project-1/download-mp3/MP3/`);
  console.log(listTemp.stdout.split('\n')[0]);
  console.log(data);
  return {...data,mp3Url};
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkAlbumExist(name){
  const sql = 'SELECT id FROM album WHERE name = ?';
  const result = await dbUtil.queryOne(sql, [name]);
  console.log('album', result);
  if(result){
    return result.id;
  }else{
    return null;
  }
}
async function checkCategoryExist(name){
  const sql = 'SELECT id FROM categories WHERE name = ?';
  const result = await dbUtil.queryOne(sql, [name]);
  console.log('categories', result);
  if(result){
    return result.id;
  }else{
    return null;
  }
}

async function checkSingerExist(name){
  const sql = 'SELECT id FROM singers WHERE name = ?';
  const result = await dbUtil.queryOne(sql, [name]);
  console.log('singers', result);
  if(result){
    return result.id;
  }else{
    return null;
  }
}
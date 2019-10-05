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
const url = 'https://zingmp3.vn/bai-hat/Yeu-La-Tha-Thu-Em-Chua-18-OST-OnlyC/ZW7DAIDA.html';

let browser;
let page;
const alpha = 0;
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
    const checkSinger = await checkSingerExist(singer);
    // id 
    let albumId;
    let singerId;
    let songId = uuidv4();
    // check neu co roi tang so luong bai hat
    if(checkAlbum){
      albumId = checkAlbum;
      const inceaseNumber = 'UPDATE album SET songNumber +=1 WHERE id = = ?';
      await dbUtil.execute(inceaseNumber, [albumId], transaction);
    }else{
      // ko thi tao album moi
      albumId = uuidv4();
      if(album){
        const addAlbumSql = 'INSERT INTO album(id,name,img) VALUES(?,?,?)';
        await dbUtil.execute(addAlbumSql, [albumId, album, imgSong], transaction);
      }
    }
    // tuong tu voi singer
    if(checkSinger){
      singerId = checkSinger;
    }else{
      // ko thi tao singer moi
      singerId = uuidv4();
      const addSingerSql = 'INSERT INTO singers(id,name,avatar) VALUES(?,?,?)';
      await dbUtil.execute(addSingerSql, [singerId, singer, imgSinger], transaction);
    }
    // them singer_album
    if(album){
      const singerAlbumSql = 'INSERT IGNORE INTO singer_album(albumId,singerId) VALUES(?,?)';
      await dbUtil.execute(singerAlbumSql, [albumId, singerId], transaction);
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
    // them vao singer_song
    const singerSongSql = 'INSERT IGNORE INTO singer_song(singerId,songId) VALUES(?,?)';
    await dbUtil.execute(singerSongSql, [singerId, songId], transaction);
    await dbUtil.commitTransaction(transaction);
  }catch(e){
    console.log(e);
    await dbUtil.rollbackTransaction(transaction);
  }
}
const startGame = async function () {
  await page.goto(url);
  await page.waitFor(".medium-card-11 ", {timeout: 5000});
  await sleep(2000);
  const data = await page.evaluate((_) => {
    let arrCategories = [];
    const name = document.querySelector('.left-info h3').innerHTML || null;
    const singer = document.querySelector('.artist-name a')? document.querySelector('.artist-name a').innerText : null;
    const album = document.querySelector('.left-info .ml-5 ')? document.querySelector('.left-info .ml-5 ').innerHTML : null;
    const writer = document.querySelector('.subtext.authors a')? document.querySelector('.subtext.authors a').innerHTML : null;
    const numberCate = document.querySelectorAll('.subtext.category a').length || null;
    const imgSinger = document.querySelector('.medium-circle-card a img').src || null;
    const imgSong = document.querySelector('.medium-card-11  img').src || null;
    const lengthRaw = document.querySelector('.z-time.z-duration-time').innerHTML || null;
    const lengthString = lengthRaw.split('/ ')[1];
    console.log(lengthString);
    const minute = lengthString.split(':')[0];
    const second = lengthString.split(':')[1];
    const length =parseInt(minute * 60) + parseInt(second);
    for(let i = 0; i < numberCate; i++ ){
      arrCategories.push(document.querySelectorAll('.subtext.category a')[i].attributes.title.textContent);
    }
    document.querySelector('.icon.ic-sync-white').click()
    return {
      name,
      singer,
      album,
      writer,
      categories: arrCategories,
      imgSinger,
      imgSong,
      length,
    }
  })
  await sleep(1000);
  await page.click('.z-type');
  await sleep(6000);
  const listTemp = await shell.exec('ls ~/Documents/Code/Project-1/Back-end_MP3_Online/Temp');
  const mp3Url = listTemp.stdout.split('\n')[0];
  await shell.exec(`mv ~/Documents/Code/Project-1/Back-end_MP3_Online/Temp/${mp3Url} ~/Documents/Code/Project-1/Back-end_MP3_Online/MP3/`);
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
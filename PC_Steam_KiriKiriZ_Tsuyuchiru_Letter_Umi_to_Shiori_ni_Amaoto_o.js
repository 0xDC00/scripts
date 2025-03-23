// ==UserScript==
// @name         ツユチル・レター～海と栞に雨音を～ / Letters From a Rainy Day -Oceans and Lace-
// @version      
// @author       Tom (tomrock645)
// @description  Steam
// * Developer   Lily Spinel
// * Publisher   HUBLOTS, mirai works
// * Engine      KiriKiriZ
//
// https://store.steampowered.com/app/1637370/Letters_From_a_Rainy_Day_Oceans_and_Lace/
// ==/UserScript==


const engine = require('./libPCKiriKiriZ.js');

engine.hookTextrenderDll(function (text) {
    trans.send(text);
    return text;
});
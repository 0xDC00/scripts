// ==UserScript==
// @name         [01009CB01BD36000] YOHANE THE PARHELION -BLAZE in the DEEPBLUE-
// @version      1.0.0
// @author       Tom (tomrock645)
// @description  Yuzu
// * Developer & publisher: INTI CREATES CO., LTD.
// * 
// ==/UserScript==

const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '50+');

setHook(
  {
    "1.0.0": {
      [0x8070197c - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x8070b16c - 0x80004000]: mainHandler.bind_(null, 0, "name"),
      [0x80719d08 - 0x80004000]: mainHandler.bind_(null, 0, "message"), // First pop up message (from boards and when a member's attack has been upgraded)
      [0x8071a164 - 0x80004000]: mainHandler.bind_(null, 0, "message"), // Second pop up message (only occurs with a board or two)
      [0x8095fac4 - 0x80004000]: mainHandler.bind_(null, 0, "item description"), 
      [0x80662934 - 0x80004000]: mainHandler.bind_(null, 1, "menu dialogue"),
      [0x80983dd0 - 0x80004000]: mainHandler.bind_(null, 0, "shop quantity"),
      [0x80984740 - 0x80004000]: mainHandler.bind_(null, 0, "shop confirmation"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

console.warn("\nKnown issues:\n- The item description hook might print out an empty line after buying or creating an item.");
console.warn("\n- When consuming or creating an item the name doesn't get hooked, so I made it generic using \"[アイテム]\"\n");

let previousDescription = "";
function handler(regs, index, hookname) 
{
  console.warn("Hook: " + hookname);
  const address = regs[index].value;

  if(hookname === "text" || hookname === "name")
    processBinaryString(address, hookname);

  else
  {
    const reg = regs[index];
    let s = address.readUtf8String();
    
    if (hookname === "item description")
    {
      if (previousDescription === s)
      {
        // item description gets extracted again when leaving the shop, this prevents that and reset the variable in case it was the first item on the list,
        // which would otherwise not display the item's description next time we visit the shop.
        previousDescription = "";                     
        return;
      }

      previousDescription = s;
    }

    if(hookname === "message")
      s = hardcode(s); // Some parts needing some hardcoding as the hook wouldn't grab the members' names and two items' names

    s = s
      .replace(/<[^>]+>/g, "")
      .replace(/^を\n/g, "[アイテム]を\n"); // Menu dialogue can't hook the name of an item, so this makes it generic

    return s;
  }
}



const encoder = new TextEncoder('utf-8');
const decoder = new TextDecoder('utf-8');
let currentName = "";

function processBinaryString(address, hookname) 
{
  let s = '', c;

  while (c = address.readU8()) 
    {
    if (c >= 0x20) // Read printable characters 
      {  
        c = decoder.decode(address.readByteArray(4))[0]; // utf-8: 1->4 bytes.
        s += c;
        address = address.add(encoder.encode(c).byteLength);
    }

    else
    {
      if (c === 0x0A) 
        s += "\n";
    
      address = address.add(1);
    }
  }

  if (hookname === "name") 
    {
      currentName = s.trim();
      return;
    }

  if (s) 
  {
    if (currentName) // Prepend the current name if it exists 
    {
      s = currentName + "\n" + s.trim();
    }

    s = s.replace(/<[^>]+>/g, "");

    trans.send(s);
  }
}



function hardcode(s)
{
  // To include the members' names when upgrading their attacks.
  if (s.includes("バップガンの弾がより遠くに飛ぶようになった")) // チカ
      s = "チカ" + s;

    else if (s.includes("地形を貫通する火炎魔法攻撃")) // リコ
      s = "リコ" + s;

    else if (s.includes("トノサマによる連続ラッシュパンチ")) // カナン
      s = "カナン" + s;

    else if (s.includes("ノートＰＣが強力な大爆発を起こす")) // ハナマル
      s = "ハナマル" + s;

    else if (s.includes("デルタによる電撃突進攻撃")) // ダイヤ
      s = "ダイヤ" + s;

    else if (s.includes("コットンキャンディが周囲のものを飲み込み始める")) // ルビィ 
      s = "ルビィ" + s;

    else if (s.includes("時間を凍てつかせ")) // マリ
      s = "マリ" + s;

    else if (s.includes("無敵の砲弾と化したヨハネがすべてを貫く")) // ヨウ
      s = "ヨウ" + s;


    // After talking to マリ at ヨハネ's for the first time
    else if (s.includes("が購入可能になった")) 
    s = "「シャイ煮」と「堕天使の涙」が購入可能になった！";


    return s;
}
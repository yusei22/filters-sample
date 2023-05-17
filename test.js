class a {
  static Mosaic(ImageData, newImageData, msize) {
    const oldData = ImageData.data;
    const newData = newImageData.data;
    // モザイクの大きさの単位で繰り返す
    for (let y = 0; y < ImageData.height; y += msize) {
      for (let x = 0; x < ImageData.width; x += msize) {
        // モザイクの大きさを計算する
        let msizex = msize;
        let msizey = msize;
        // モザイクの正方形が右か下にはみ出した場合の処理
        if (x + msize > ImageData.width) {
          msizex = ImageData.width - x;
        }
        if (y + msize > ImageData.height) {
          msizey = ImageData.height - y;
        }

        // モザイクの長方形内の点の色の平均を計算する
        let mr = 0;
        let mg = 0;
        let mb = 0;
        // imageData, newImageData の点の data のインデックス値
        let pt;
        pt = (x + y * ImageData.width) * 4;
        for (let y2 = 0; y2 < msizey; y2++) {
          for (let x2 = 0; x2 < msizex; x2++) {
            mr += oldData[pt];
            mg += oldData[pt + 1];
            mb += oldData[pt + 2];
            pt += 4;
            // 下記のほうがわかりやすいが、上記のほうが高速なので上記を採用する
            //mr += getr(imageData, x + x2, y + y2);
            //mg += getg(imageData, x + x2, y + y2);
            //mb += getb(imageData, x + x2, y + y2);
          }
          pt += 4 * (ImageData.width - msizex);
        }
        let dotnum = msizex * msizey;
        mr = Math.floor(mr / dotnum);
        mg = Math.floor(mg / dotnum);
        mb = Math.floor(mb / dotnum);

        // 平均化した色でモザイクの長方形を塗る
        pt = (x + y * ImageData.width) * 4;
        for (let y2 = 0; y2 < msizey; y2++) {
          for (let x2 = 0; x2 < msizex; x2++) {
            newData[pt] = mr;
            newData[pt + 1] = mg;
            newData[pt + 2] = mb;
            newData[pt + 3] = 255;
            pt += 4;
            // 下記のほうがわかりやすいが、上記のほうが高速なので上記を採用する
            // drawpixel(newImageData, x + x2, y + y2, mr, mg, mb, 255);
          }
          pt += 4 * (imageData.width - msizex);
        }
      }
    }
  }
  Blur(bsize, ImageData = this.ImageData, Context = this.Context) {
    // ぼかしの点の数
    let dotnum = bsize * bsize;
    const oldData = ImageData.data;
    const newImageData = Context.createImageData(ImageData);
    const newData = newImageData.data;
    // ぼかしの半分の大きさ（この幅だけ画像の上下左右に同じ点が続くものとして計算する）
    let bsize2 = Math.floor(bsize / 2);
    // 画像の各点のRGBの色を格納する2次元配列
    // ただし、x座標は bsize2 の分だけ右にずれる
    // また、0 ～ bsize2 の範囲では x座標が 0 の色の値、
    // imageData.width ～ imageData.width + bsize の範囲では x座標が imageData.width の色の値が入る
    let ar = new Array();
    let ag = new Array();
    let ab = new Array();
    let aa = new Array();
    // imageData のdataのインデックス値 
    let pt = 0;
    // ぼかしを計算するための各点の色を取得する
    for (let y = 0; y < ImageData.height; y++) {
      ar[y] = new Array();
      ag[y] = new Array();
      ab[y] = new Array();
      aa[y] = new Array();
      // ぼかしの半分のサイズだけ左端の点は同じ色を設定する
      for (let x = 0; x < bsize2; x++) {
        ar[y][x] = oldData[pt];
        ag[y][x] = oldData[pt + 1];
        ab[y][x] = oldData[pt + 2];
        aa[y][x] = oldData[pt + 3];
      }
      // 各点の色を取得する
      for (let x = bsize2; x < ImageData.width + bsize2; x++) {
        ar[y][x] = oldData[pt];
        ag[y][x] = oldData[pt + 1];
        ab[y][x] = oldData[pt + 2];
        aa[y][x] = oldData[pt + 3];
        pt += 4;
      }
      // ぼかしの半分のサイズだけ右端の点は同じ色を設定する
      pt -= 4;
      for (let x = ImageData.width + bsize2; x < ImageData.width + bsize - 1; x++) {
        ar[y][x] = oldData[pt];
        ag[y][x] = oldData[pt + 1];
        ab[y][x] = oldData[pt + 2];
        aa[y][x] = oldData[pt + 3];
      }
      pt += 4;
    }

    // 横方向のぼかしの点の色の合計を計算する（ここではまだ平均化はしない）
    // ぼかしの点の色の合計を格納する変数
    let br, bg, bb,ba;
    // 画像の各点の横方向のぼかしの点の色の合計を格納する2次元配列
    // ただし、y座標は bsize2 の分だけ下にずれる
    // また、0 ～ bsize2 の範囲では y座標が 0 の色の値、
    // imageData.height ～ imageData.height + bsize の範囲では y座標が imageData.height の色の値が入る
    let ar2 = new Array();
    let ag2 = new Array();
    let ab2 = new Array();
    let aa2 = new Array();
    for (let y = bsize2; y < ImageData.height + bsize2; y++) {
      let y2 = y - bsize2;
      ar2[y] = new Array();
      ag2[y] = new Array();
      ab2[y] = new Array();
      aa2[y] = new Array();
      br = bb = bg =ba= 0;
      // 左端のぼかしの点の色の合計を計算する
      for (let x = 0; x < bsize; x++) {
        br += ar[y2][x];
        bg += ag[y2][x];
        bb += ab[y2][x];
        ba += aa[y2][x];
      }
      // 各点の横方向のぼかしの点の色の合計を計算する
      for (let x = 0; x < ImageData.width; x++) {
        ar2[y][x] = br;
        ag2[y][x] = bg;
        ab2[y][x] = bb;
        aa2[y][x] = ba;
        // 次の点のぼかしの点の色の合計を計算する
        br += ar[y2][x + bsize] - ar[y2][x];
        bg += ag[y2][x + bsize] - ag[y2][x];
        bb += ab[y2][x + bsize] - ab[y2][x];
        ba += aa[y2][x + bsize] - aa[y2][x];
      }
    }
    // ぼかしの半分のサイズだけ上端の点は同じ色を設定する
    for (let y = 0; y < bsize2; y++) {
      ar2[y] = new Array();
      ag2[y] = new Array();
      ab2[y] = new Array();
      aa2[y] = new Array();
      for (let x = 0; x < ImageData.width; x++) {
        ar2[y][x] = ar2[bsize2][x];
        ag2[y][x] = ag2[bsize2][x];
        ab2[y][x] = ab2[bsize2][x];
        aa2[y][x] = aa2[bsize2][x];
      }
    }
    // ぼかしの半分のサイズだけ下端の点は同じ色を設定する
    for (let y = ImageData.height + bsize2; y < ImageData.height + bsize; y++) {
      ar2[y] = new Array();
      ag2[y] = new Array();
      ab2[y] = new Array();
      aa2[y] = new Array();
      for (let x = 0; x < ImageData.width; x++) {
        ar2[y][x] = ar2[ImageData.height][x];
        ag2[y][x] = ag2[ImageData.height][x];
        ab2[y][x] = ab2[ImageData.height][x];
        aa2[y][x] = aa2[ImageData.height][x];
      }
    }

    // 縦方向に平均化したぼかしの点の色の合計を計算する
    for (let x = 0; x < ImageData.width; x++) {
      pt = 4 * x;
      br = bb = bg =ba= 0;
      // 上端のぼかしの点の色の合計を計算する
      for (let y = 0; y < bsize; y++) {
        br += ar2[y][x];
        bg += ag2[y][x];
        bb += ab2[y][x];
        ba += aa2[y][x];
      }
      // 各点の縦方向のぼかしの点の色の合計を計算する
      for (let y = 0; y < ImageData.height; y++) {
        // 計算した結果を imageData の画像の色に反映する（ここで平均化する）
        newData[pt] = Math.floor(br / dotnum);
        newData[pt + 1] = Math.floor(bg / dotnum);
        newData[pt + 2] = Math.floor(bb / dotnum);
        newData[pt + 3] = Math.floor(ba / dotnum);
        // 次の点のぼかしの点の色の合計を計算する
        pt += ImageData.width * 4;
        br += ar2[y + bsize][x] - ar2[y][x];
        bg += ag2[y + bsize][x] - ag2[y][x];
        bb += ab2[y + bsize][x] - ab2[y][x];
        ba += aa2[y + bsize][x] - aa2[y][x];
      }
    }
  }
}
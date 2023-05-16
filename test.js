class a{
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
}
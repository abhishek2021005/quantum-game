import _ from 'lodash';
import d3 from 'd3';

import * as tile from './tile';
import {tileSize, stockBottomMargin} from './config';
import {bindDrag} from './drag_and_drop';

export class Stock {
  constructor(svg, board) {
    this.svg = svg;
    this.board = board;
  }

  elementCount(level) {
    this.stock = level.initialStock;

    // initialize 0-count stock for non-frozen tiles on board
    level.tileRecipes.forEach((tileRecipe) => {
      if (!tileRecipe.frozen && !_.has(this.stock, tileRecipe.name)) {
        this.stock[tileRecipe.name] = 0;
      }
    });

    this.usedTileNames = _.keys(this.stock);  // add some ordering to the stock?
    this.level = level;
  }

  drawStock() {

    // Reset element
    this.svg.select('.stock').remove();
    this.stockGroup = this.svg
      .append('g')
        .attr('class', 'stock');

    // Create background
    const maxRows = this.level.height - stockBottomMargin;
    const iShift = this.level.width + 1;

    const dataForStockDrawing = _.map(this.usedTileNames, (name, i) => ({
        name: name,
        i: Math.floor(i / maxRows) + iShift,
        j: i % maxRows,
    }));

    this.stockSlots = this.stockGroup
      .selectAll('.stock-slot')
      .data(dataForStockDrawing);

    const stockSlotsEntered = this.stockSlots.enter()
      .append('g')
        .attr('class', 'stock-slot')
        .classed('stock-empty', (d) => this.stock[d.name] <= 0);

    stockSlotsEntered.append('rect')
      .attr('class', 'background-tile')
      .attr('width', tileSize)
      .attr('height', tileSize)
      .attr('transform', (d) => `translate(${d.i * tileSize},${d.j * tileSize})`);

    stockSlotsEntered.append('text')
      .attr('class', 'stock-count')
      .attr('transform', (d) => `translate(${(d.i + 0.9) * tileSize},${(d.j + 0.9) * tileSize})`)
      .text((d) => `x ${this.stock[d.name]}`);

    this.stockTiles = stockSlotsEntered.append('g')
      .datum((d) => new tile.Tile(tile[d.name], 0, false, d.i, d.j))
      .attr('class', 'tile')
      .attr('transform', (d) => `translate(${d.x + tileSize / 2},${d.y + tileSize / 2})`)
      .each(function (tileObj) {
        tileObj.g = d3.select(this);
        tileObj.node = this;
        tileObj.fromStock = true;
        tileObj.draw();
      });

    this.stockTiles.append('use')
      .attr('xlink:href', '#hitbox')
      .attr('class', 'hitbox')
      .on('mouseover', this.board.callbacks.tileMouseover);

    bindDrag(this.stockTiles, this.board, this);

  }

  regenerateTile(stockSlotG) {

    const newTile = stockSlotG.append('g')
      .datum((d) => new tile.Tile(tile[d.name], 0, false, d.i, d.j))
      .attr('class', 'tile')
      .attr('transform', (d) => `translate(${d.x + tileSize / 2},${d.y + tileSize / 2})`)
      .each(function (tileObj) {
        tileObj.g = d3.select(this);
        tileObj.node = this;
        tileObj.fromStock = true;
        tileObj.draw();
      });

    newTile.append('use')
      .attr('xlink:href', '#hitbox')
      .attr('class', 'hitbox')
      .on('mouseover', this.board.callbacks.tileMouseover);

    bindDrag(newTile, this.board, this);

  }

  updateCount(tileName, change) {

    this.stock[tileName] += change;

    this.stockSlots
      .classed('stock-empty', (d) => this.stock[d.name] <= 0);

    this.stockSlots.select('text')
      .text((d) => `x ${this.stock[d.name]}`);
  }

}

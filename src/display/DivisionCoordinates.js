export class DivisionCoordinates {
  constructor({ width, height, divisionsX, divisionsY, marginTop, marginBottom, marginLeft, marginRight }) {
    this.width = width;
    this.height = height;
    this.divisionsX = divisionsX;
    this.divisionsY = divisionsY;
    this.marginTop = marginTop;
    this.marginBottom = marginBottom;
    this.marginLeft = marginLeft;
    this.marginRight = marginRight;

    this.gridLeft = marginLeft;
    this.gridTop = marginTop;
    this.gridWidth = width - marginLeft - marginRight;
    this.gridHeight = height - marginTop - marginBottom;
    this.pxPerDivX = this.gridWidth / divisionsX;
    this.pxPerDivY = this.gridHeight / divisionsY;
    this.centerX = this.gridLeft + this.gridWidth / 2;
    this.centerY = this.gridTop + this.gridHeight / 2;
  }

  divXToPx(divX) {
    return this.centerX + divX * this.pxPerDivX;
  }

  divYToPx(divY) {
    return this.centerY - divY * this.pxPerDivY;
  }
}

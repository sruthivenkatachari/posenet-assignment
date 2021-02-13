export function kneeFlexion(ankle, knee, hip, side) {
  var angle =
    (Math.atan2(ankle.y - knee.y, ankle.x - knee.x) -
      Math.atan2(hip.y - knee.y, hip.x - knee.x)) *
    (180 / Math.PI);

  if (side === "right") {
    angle = 360 - angle;
  }
  return Math.round(angle);
}

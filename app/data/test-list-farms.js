const TL_HERD_DATA = {
  '12/345/6789': { cph: '12/345/6789', farm: 'Hill Farm', address: 'Hill Farm, York, YO1 1AA', cattle: '244' },
  '17/205/6790': { cph: '17/205/6790', farm: 'Moor Farm', address: 'Moor Farm, Leeds, LS1 2AB', cattle: '58' },
  '12/340/6791': {
    cph: '12/340/6791',
    farm: 'Orchard Gate Farm',
    address: 'Orchard Gate Farm, Ripon, HG4 1BC',
    cattle: '80',
    holdingLabel: 'Main holding'
  },
  '12/340/6791-01': {
    cph: '12/340/6791-01',
    farm: 'Orchard Gate Farm',
    address: 'Orchard Gate Dairy Unit, Ripon, HG4 1BC',
    cattle: '52',
    holdingLabel: 'Dairy unit'
  },
  '12/348/6792': { cph: '12/348/6792', farm: 'Willow Bank Farm', address: 'Willow Bank Farm, Selby, YO8 4CD', cattle: '41' },
  '12/325/6793': { cph: '12/325/6793', farm: 'Red Barn Farm', address: 'Red Barn Farm, Thirsk, YO7 3DE', cattle: '173' },
  '12/338/6794': { cph: '12/338/6794', farm: 'Meadow View Farm', address: 'Meadow View Farm, Harrogate, HG1 5EF', cattle: '97' },
  '12/360/6795': { cph: '12/360/6795', farm: 'Low Beck Farm', address: 'Low Beck Farm, Malton, YO17 7FG', cattle: '326' },
  '12/315/6796': { cph: '12/315/6796', farm: 'West Field Farm', address: 'West Field Farm, Bedale, DL8 1GH', cattle: '119' },
  '12/310/6797': { cph: '12/310/6797', farm: 'Oak Tree Farm', address: 'Oak Tree Farm, Skipton, BD23 2HJ', cattle: '64' },
  '24/420/6798': { cph: '24/420/6798', farm: 'Stonebridge Farm', address: 'Stonebridge Farm, Beverley, HU17 8JK', cattle: '211' },
  '12/320/6799': {
    cph: '12/320/6799',
    farm: 'High Pastures Farm',
    address: 'High Pastures Farm, Northallerton, DL7 9KL',
    cattle: '200',
    holdingLabel: 'Main holding'
  },
  '12/320/6799-01': {
    cph: '12/320/6799-01',
    farm: 'High Pastures Farm',
    address: 'High Pastures Beef Unit, Northallerton, DL7 9KL',
    cattle: '187',
    holdingLabel: 'Beef finishing unit'
  },
  '24/402/6800': { cph: '24/402/6800', farm: 'Green Lane Farm', address: 'Green Lane Farm, Pocklington, YO42 1LM', cattle: '72' },
  '24/405/6801': { cph: '24/405/6801', farm: 'Sunnyside Farm', address: 'Sunnyside Farm, Driffield, YO25 6MN', cattle: '158' },
  '12/312/6802': { cph: '12/312/6802', farm: 'Mill House Farm', address: 'Mill House Farm, Richmond, DL10 4NP', cattle: '38' },
  '12/365/6803': { cph: '12/365/6803', farm: 'Hazelcroft Farm', address: 'Hazelcroft Farm, Helmsley, YO62 5PQ', cattle: '146' },
  '17/221/6804': {
    cph: '17/221/6804',
    farm: 'Birch Hollow Farm',
    address: 'Birch Hollow Farm, Otley, LS21 3QR',
    cattle: '250',
    holdingLabel: 'Main holding'
  },
  '17/221/6804-01': {
    cph: '17/221/6804-01',
    farm: 'Birch Hollow Farm',
    address: 'Birch Hollow Youngstock Unit, Otley, LS21 3QR',
    cattle: '171',
    holdingLabel: 'Youngstock unit'
  },
  '17/218/6805': { cph: '17/218/6805', farm: 'Rosewood Farm', address: 'Rosewood Farm, Wetherby, LS22 6RS', cattle: '89' },
  '12/355/6806': { cph: '12/355/6806', farm: 'Brookside Farm', address: 'Brookside Farm, Easingwold, YO61 3ST', cattle: '184' },
  '12/370/6807': { cph: '12/370/6807', farm: 'Elm Carr Farm', address: 'Elm Carr Farm, Pickering, YO18 7TU', cattle: '267' },
  '12/352/6808': {
    cph: '12/352/6808',
    farm: 'Riverside Farm',
    address: 'Riverside Farm, Tadcaster, LS24 9UV',
    cattle: '300',
    holdingLabel: 'Main holding'
  },
  '12/352/6808-01': {
    cph: '12/352/6808-01',
    farm: 'Riverside Farm',
    address: 'Riverside Dairy Unit, Tadcaster, LS24 9UV',
    cattle: '130',
    holdingLabel: 'Dairy unit'
  },
  '12/352/6808-02': {
    cph: '12/352/6808-02',
    farm: 'Riverside Farm',
    address: 'Riverside Beef Finishing Unit, Tadcaster, LS24 9UV',
    cattle: '82',
    holdingLabel: 'Beef finishing unit'
  }
}

const TL_HERD_MARKS = {
  '12/345/6789': { mark: '341234', check: '4' },
  '17/205/6790': { mark: '120900', check: '1' },
  '12/340/6791': { mark: '562301', check: '5' },
  '12/348/6792': { mark: '123456', check: '7' },
  '12/325/6793': { mark: '473829', check: '2' },
  '12/338/6794': { mark: '258147', check: '8' },
  '12/360/6795': { mark: '369258', check: '3' },
  '12/315/6796': { mark: '741852', check: '6' },
  '12/310/6797': { mark: '852963', check: '9' },
  '24/420/6798': { mark: '963741', check: '1' },
  '12/320/6799': { mark: '147258', check: '4' },
  '24/402/6800': { mark: '321654', check: '7' },
  '24/405/6801': { mark: '654321', check: '2' },
  '12/312/6802': { mark: '987654', check: '5' },
  '12/365/6803': { mark: '456789', check: '8' },
  '17/221/6804': { mark: '246810', check: '0' },
  '17/218/6805': { mark: '135791', check: '3' },
  '12/355/6806': { mark: '579135', check: '6' },
  '12/370/6807': { mark: '813579', check: '9' },
  '12/352/6808': { mark: '183483', check: '7' }
}

const TL_BREEDS = ['HF', 'BF', 'AAX', 'LIM', 'CH', 'SIM', 'HER', 'BB', 'BALX', 'DS']

const TL_VACCINATED_FARMS = new Set(['12/345/6789', '17/205/6790', '12/340/6791', '12/348/6792', '12/325/6793', '12/338/6794'])

const TL_FARM_TB_STATUS = {
  '12/345/6789': { status: 'OTF', lastTestDate: '12 March 2025', lastBreakdown: 'None recorded' },
  '17/205/6790': { status: 'OTFW', lastTestDate: '4 February 2025', lastBreakdown: '18 August 2025' },
  '12/340/6791': { status: 'OTF', lastTestDate: '9 January 2025', lastBreakdown: '23 July 2023' },
  '12/348/6792': { status: 'OTF', lastTestDate: '27 November 2025', lastBreakdown: 'None recorded' },
  '12/325/6793': { status: 'OTFW', lastTestDate: '15 April 2025', lastBreakdown: '2 April 2025' },
  '12/338/6794': { status: 'OTF', lastTestDate: '5 October 2025', lastBreakdown: 'None recorded' },
  '12/360/6795': { status: 'OTF', lastTestDate: '30 August 2025', lastBreakdown: '14 May 2022' },
  '12/315/6796': { status: 'OTFW', lastTestDate: '3 March 2025', lastBreakdown: '9 February 2025' },
  '12/310/6797': { status: 'OTF', lastTestDate: '14 June 2025', lastBreakdown: 'None recorded' },
  '24/420/6798': { status: 'OTF', lastTestDate: '22 December 2025', lastBreakdown: 'None recorded' },
  '12/320/6799': { status: 'OTF', lastTestDate: '11 March 2025', lastBreakdown: '6 November 2024' },
  '24/402/6800': { status: 'OTF', lastTestDate: '7 November 2025', lastBreakdown: 'None recorded' },
  '24/405/6801': { status: 'OTFW', lastTestDate: '25 January 2025', lastBreakdown: '12 January 2025' },
  '12/312/6802': { status: 'OTF', lastTestDate: '19 September 2025', lastBreakdown: 'None recorded' },
  '12/365/6803': { status: 'OTF', lastTestDate: '2 July 2025', lastBreakdown: '16 May 2023' },
  '17/221/6804': { status: 'OTF', lastTestDate: '28 November 2025', lastBreakdown: 'None recorded' },
  '17/218/6805': { status: 'OTFW', lastTestDate: '8 April 2025', lastBreakdown: '1 April 2025' },
  '12/355/6806': { status: 'OTF', lastTestDate: '16 August 2025', lastBreakdown: 'None recorded' },
  '12/370/6807': { status: 'OTF', lastTestDate: '3 May 2025', lastBreakdown: '21 February 2022' },
  '12/352/6808': { status: 'OTF', lastTestDate: '30 January 2025', lastBreakdown: 'None recorded' }
}

module.exports = { TL_HERD_DATA, TL_HERD_MARKS, TL_BREEDS, TL_VACCINATED_FARMS, TL_FARM_TB_STATUS }

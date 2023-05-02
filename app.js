let express = require("express");
let obj = express();
obj.use(express.json());
let { open } = require("sqlite");
let sqlite3 = require("sqlite3");
let path = require("path");
let dbpath = path.join(__dirname, "covid19India.db");
let db = null;

let converSankeToCamel = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

let disconverSankeToCamel = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};

let initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    obj.listen(3000, () => {
      console.log("Server initialized at localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeDbAndServer();

//get
obj.get("/states/", async (request, Response) => {
  let getQueury = `
        SELECT 
            *
        FROM 
            state;
    `;
  let resultpromise = await db.all(getQueury);
  let result = [];
  for (let item of resultpromise) {
    let converted = converSankeToCamel(item);
    result.push(converted);
  }
  Response.send(result);
});

//getone
obj.get("/states/:stateId/", async (request, Response) => {
  let { stateId } = request.params;
  let getQueury = `
        SELECT 
            *
        FROM 
            state
        WHERE
            state_id = ${stateId};    
    `;
  let resultpromise = await db.get(getQueury);
  let result = converSankeToCamel(resultpromise);

  Response.send(result);
});
//post
obj.post("/districts/", async (request, Response) => {
  let { districtName, stateId, cases, cured, active, deaths } = request.body;
  let postQuery = `
        INSERT INTO district
            (district_name, state_id, cases, cured,active,deaths)
            VALUES('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');
    `;
  await db.run(postQuery);
  Response.send("District Successfully Added");
});

//getdisone
obj.get("/districts/:districtId/", async (request, Response) => {
  let { districtId } = request.params;
  let getQueury = `
        SELECT 
            *
        FROM 
            district
        WHERE
            district_id = ${districtId};    
    `;
  let resultpromise = await db.get(getQueury);
  let result = disconverSankeToCamel(resultpromise);

  Response.send(result);
});
//delete
obj.delete("/districts/:districtId/", async (request, Response) => {
  let { districtId } = request.params;
  let deleteQuery = `
        DELETE FROM district WHERE district_id = ${districtId};
    `;
  await db.run(deleteQuery);
  Response.send("District Removed");
});
//put

obj.put("/districts/:districtId/", async (request, Response) => {
  let { districtName, stateId, cases, cured, active, deaths } = request.body;
  let { districtId } = request.params;
  let updateQuery = `
       UPDATE district
       SET
            district_name = '${districtName}',
            state_id = '${stateId}',
            cases = '${cases}',
            cured = '${cured}',
            active = '${active}',
            deaths = '${deaths}'
        WHERE district_id = ${districtId};
    `;
  await db.run(updateQuery);
  Response.send("District Details Updated");
});

//get
obj.get("/states/:stateId/stats/", async (request, Response) => {
  let { stateId } = request.params;
  let getQueury = `
        SELECT 
            cases AS totalCases,
            cured AS totalCured,
            active AS totalActive,
            deaths AS totalDeaths
        FROM 
            district
        WHERE
            state_id = ${stateId};    
    `;
  let resultpromise = await db.get(getQueury);
  Response.send(resultpromise);
});

//get
obj.get("/districts/:districtId/details/", async (request, Response) => {
  let { districtId } = request.params;
  let getQueury = `
        SELECT 
            state_id
        FROM 
            district
        WHERE
            district_id = ${districtId};    
    `;
  let stateIdRes = await db.get(getQueury);
  let stateNameQue = `
    SELECT state_name AS stateName FROM state
    WHERE state_id = '${stateIdRes.state_id}';
  `;
  let res = await db.get(stateNameQue);
  Response.send(res);
});
module.exports = obj;

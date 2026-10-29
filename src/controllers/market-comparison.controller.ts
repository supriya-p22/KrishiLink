import { NextFunction, Request, Response } from "express";
import { compareCropMarkets } from "../services/market-comparison.service";
import { BadRequestError } from "../utils/http-error";
const parseId=(v: unknown,l: string)=>{if(typeof v!=="string"||!/^[A-Za-z0-9_-]+$/.test(v))throw new BadRequestError(`${l} is invalid`);return v;};
export async function getMarketComparison(r: Request,s: Response,n: NextFunction){try{const q=r.query.limit;const limit=q===undefined?undefined:typeof q==="string"&&/^\d+$/.test(q)&&Number(q)>0?Number(q):(()=>{throw new BadRequestError("limit must be a positive integer");})();s.json({success:true,data:await compareCropMarkets(parseId(r.params.cropId,"Crop id"),r.query.marketId===undefined?undefined:parseId(r.query.marketId,"Market id"),limit)});}catch(e){n(e);}}

import {PdvError} from './pdv-engine.mjs';
export function pdvErrorMessage(error:unknown){return error instanceof PdvError?error.message:'Não foi possível concluir. Confira os campos, atualize e tente novamente.';}

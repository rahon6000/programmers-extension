import { Problem } from "./extension";

const javaCodeBuilder = (problem: Problem, language: string): string => {
    let result: string = "";

    let tcCases = "";
    let outputIter = "";
    let outputType = "";
    let inputTypes = "";
    let outputDimension = 0;

    // generate elements...

    // TC cases generate
    for (let i = 0; i < problem.tcCase.length; i++) {
        if (i % problem.tcHeader.length === problem.tcHeader.length - 1) {
            outputType = getJavaType(problem.tcCase[i]);

        } else {
            if (Math.floor(i / problem.tcHeader.length) > 0) { tcCases += "\t\t//"; } // comment out
            else { tcCases += "\t\t" }
            tcCases += (getJavaType(problem.tcCase[i]) + " ");
            tcCases += (problem.tcHeader[i % problem.tcHeader.length] + " = ");
            tcCases += (convertToJavaStyle(problem.tcCase[i]) + ";");
            tcCases += "\t\t//TC #" + Math.floor(i / problem.tcHeader.length + 1) + "\n";
        }
    }

    // TC type (from table column names) generate
    for (let i = 0; i < problem.tcHeader.length - 1; i++) {
        inputTypes += (getJavaType(problem.tcCase[i]) + " " + problem.tcHeader[i]);
        if (i === problem.tcHeader.length - 2) {
            break;
        } else { inputTypes += ", "; }
    }

    // iterate output if output type is array (정신 나갈 것 같애~)
    outputDimension = getDimension(problem.tcCase[problem.tcHeader.length - 1]);
    if (outputDimension > 0) {
        // for loop starts
        for (let i = 0; i < outputDimension; i++) { outputType += "[]"; }
        outputIter +=
            `System.out.print("[");
        for( `+ outputType.split("[")[0] + ` i : output ){\n`;
        for (let i = 0; i < outputDimension; i++) {  // For loop for array answer ##########
            outputIter +=
                `            System.out.print(output);
            if ( i == (output.length-1)) break;
            else System.out.print(", ");\n`;
        }                                           // For loop for array answer ##########
        // for loop ends
        outputIter +=
            `        }
        System.out.println("]");\n`;
    } else {
        // single output case.
        outputIter = `System.out.println(output);\n`;
    }

    // formatting...
    result =
        `\nclass Solution {
    public static void main(String[] args){
        Solution my = new Solution();
        // TCs\n` +
        tcCases +
        `

        // Solution output\n\t\t` +
        `` + outputType + ` output = my.solution(`;
    for (let i = 0; i < problem.tcHeader.length - 1; i++) {
        result += problem.tcHeader[i];
        if (i === problem.tcHeader.length - 2) { break; }
        else { result += ", "; }
    }
    result += `);\n\t\t` +
        outputIter +
        `    }
    public ` + outputType + ` solution(` + inputTypes + `) {
        ` + outputType + ` answer;
        return answer;
    }
}`;

    return result;
};

const javaCodeExporter = (str: string ): string => {
    // find "public static void main"
    // find { } closing position using stack
    let mainMethodS = str.search("public static void main(");
    let afterMainMethod = str.substring(mainMethodS);
    let mainMethodE = 0;
    let stack = 0;
    for(let i = 0; i < afterMainMethod.length; i++){
        let charbuffer = afterMainMethod.charAt(i);
        if(charbuffer === "{"){
            stack ++;
        } else if(charbuffer === "}") {
            stack --;
            if (stack === 0) {
                mainMethodE = mainMethodS + i;
                break;
            }
        }
    }
    // get substrings
    let firstPartOfString = str.substring(0, mainMethodS);
    let secondPartOfString = str.substring(mainMethodE+1);

    return firstPartOfString + secondPartOfString;
};

function getJavaType(str: string): string {
    let dimension = 0;
    let typeStr = "";
    for (let i = 0; i < str.length; i++) {
        let charInStr = str.charAt(i);
        if (charInStr === '[') {
            dimension++;
        } else if (charInStr === '\"' || charInStr === "\'") {
            typeStr = "String";
            break;
        } else if (charInStr.toLowerCase() === "t" || charInStr.toLowerCase() === "f") {
            typeStr = "Boolean";
            break;
        } else {
            for (let j = i; j < str.length; j++) {
                let bufferChar = str.charAt(j);
                if (bufferChar === ".") {
                    typeStr = "float";
                    break;
                } else if (bufferChar === ",") {
                    typeStr = "int";
                } else if (bufferChar.charCodeAt(0) >= "0".charCodeAt(0) ||
                    bufferChar.charCodeAt(0) <= "9".charCodeAt(0)) {
                    continue;
                } else { throw Error("Error : type unsure."); }
            }
            typeStr = "int"; // float, doulbe 일수도 있자나...?
            break;
        }
    }
    for (let i = 0; i < dimension; i++) {
        typeStr += "[]";
    }
    return typeStr;
}

function convertToJavaStyle(str: string): string {
    return str.replaceAll("[", "{").replaceAll("]", "}");
}

function getDimension(answer: string): number {
    let result: number = 0;
    for (let i = 0; i < answer.length; i++) {
        let charInStr = answer.charAt(i);
        if (charInStr === '[') {
            result++;
        } else { break; }
    }

    return result;
}


export { javaCodeBuilder, javaCodeExporter };


export namespace main {
	
	export class FileStats {
	    lines: number;
	    sizeKB: string;
	    modifiedDate: string;
	
	    static createFrom(source: any = {}) {
	        return new FileStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.lines = source["lines"];
	        this.sizeKB = source["sizeKB"];
	        this.modifiedDate = source["modifiedDate"];
	    }
	}

}


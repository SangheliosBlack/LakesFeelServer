const { Schema,model } = require ('mongoose');

const PulseraSchema = Schema({
    numero:{
        type:String,
        require:true
    },
    usuario:{
        type:Schema.Types.ObjectId,
        require:false
    },
    recargas:[
        {
            type:Schema(
                {
                    cantidad:{
                        type:Number,
                        require:true
                    },
                    usuario:{
                        type:Schema.Types.ObjectId,
                        require:true
                    }
                },
                {
                    timestamps: true
                }
            )
        }
    ]
})

PulseraSchema.method('toJson',function(){
    const{__v,id,...object} = this.toObject();
    return object;
});

module.exports = model('Pulsera',PulseraSchema);
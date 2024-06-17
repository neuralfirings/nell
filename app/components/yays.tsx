function randomIntFromInterval(min: number, max: number) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export default function YayWidget({r}: {r: number}) {
  const yays=[
    "F9hQLAVhWnL56", //groot
    "l3V0lsGtTMSB5YNgc", //panda
    "QW5nKIoebG8y4", //peanuts
    "dZ8nmFzPpqAb2RGYYC", // pig,
    "IB9foBA4PVkKA", //pbj time
    "3o72FkreWNH9OlTtPq", // shark
    "puFgQGYANZRUhFU0eE", //dog
    "lNwcQz1tRYjtGYpbp3", //elephant
    "gbmWwWm4sGMQvAYm1G", // cat
    "VBEd4PzBjdG3S", // penguin
    "YPNSva1pEGFFu", //dog
    "huJEYlQEr3SBq", // stars
    "3ohs4oWkzyVeVgTwKQ", //stars
    "XOU7R2LTLF4yDUFn5K", // stars
  ]

  const yIdx = Math.floor(r * yays.length)
  // const r = randomIntFromInterval(0, yays.length-1)

  return(
    <div style={{width:"100%", height:"0", paddingBottom: "99%", position:"relative"}}>
      <iframe src={`https://giphy.com/embed/${yays[yIdx]}`} width="100%" height="100%" style={{position: "absolute"}} frameBorder="0"  allowFullScreen></iframe>
    </div>
  )

}
use anyhow::Result;
use clap::Parser;
use draffle_cli::entrypoint::{entry, Opts};

fn main() -> Result<()> {
    entry(Opts::parse())
}

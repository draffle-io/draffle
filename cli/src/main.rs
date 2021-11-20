use anyhow::Result;
use clap::Clap;
use draffle_cli::entrypoint::{entry, Opts};

fn main() -> Result<()> {
    entry(Opts::parse())
}
